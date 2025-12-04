"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";

// Extended Image extension with upload status attribute
const ImageWithUploadStatus = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-uploading': {
        default: null,
        parseHTML: element => element.getAttribute('data-uploading'),
        renderHTML: attributes => {
          if (!attributes['data-uploading']) {
            return {};
          }
          return {
            'data-uploading': attributes['data-uploading'],
          };
        },
      },
    };
  },
});
import { uploadMediaToStorage } from "@/lib/firebase/uploadMedia";
import { useAuth } from "@/lib/auth/AuthProvider";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { 
  Bold, 
  Italic, 
  Strikethrough,
  List,
  ListOrdered,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo
} from "lucide-react";
import { Button } from "./ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  hideImageUpload?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Add a comment...",
  disabled = false,
  className = "",
  hideImageUpload = false,
}: RichTextEditorProps) {
  const { user } = useAuth();
  const previousImageUrlsRef = useRef<Set<string>>(new Set());

  // Extract image URLs from HTML content
  const extractImageUrls = (html: string): Set<string> => {
    const imageUrls = new Set<string>();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = doc.querySelectorAll('img');
    
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && (src.includes('storage.googleapis.com') || src.includes('firebasestorage.app'))) {
        // Only track Firebase Storage URLs, not blob URLs
        imageUrls.add(src);
      }
    });
    
    return imageUrls;
  };

  // Delete image from Firebase Storage
  const deleteImageFromStorage = async (imageUrl: string) => {
    if (!user) return;
    
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ url: imageUrl }),
      });

      const data = await response.json();
      if (!data.success) {
        console.warn(`Failed to delete image from storage: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting image from storage:", error);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      ImageWithUploadStatus.configure({
        inline: true,
        allowBase64: false,
      }),
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const currentHtml = editor.getHTML();
      const currentImageUrls = extractImageUrls(currentHtml);
      const previousImageUrls = previousImageUrlsRef.current;

      // Find images that were removed
      previousImageUrls.forEach((url) => {
        if (!currentImageUrls.has(url)) {
          // Image was removed, delete from storage
          deleteImageFromStorage(url);
        }
      });

      // Update the ref with current images
      previousImageUrlsRef.current = currentImageUrls;
      
      onChange(currentHtml);
    },
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] px-3 py-2",
        "data-placeholder": placeholder,
      },
    },
  });

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
      // Update the image URLs ref when content is set externally
      previousImageUrlsRef.current = extractImageUrls(value);
    }
  }, [value, editor]);

  // Initialize image URLs ref on mount
  useEffect(() => {
    if (editor) {
      previousImageUrlsRef.current = extractImageUrls(editor.getHTML());
    }
  }, [editor]);

  const handleImageUpload = async () => {
    if (!user) {
      toast.error("You must be logged in to upload images");
      return;
    }

    if (!editor) return;

    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Check file size (max 10MB for images)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }

      // Create a temporary blob URL to show image immediately
      const tempBlobUrl = URL.createObjectURL(file);
      
      // Insert image immediately with blob URL
      editor.chain().focus().setImage({ src: tempBlobUrl }).run();
      
      // Mark the image as uploading using a transaction
      setTimeout(() => {
        const { tr } = editor.state;
        let found = false;
        
        tr.doc.descendants((node, pos) => {
          if (node.type.name === 'image' && node.attrs.src === tempBlobUrl && !found) {
            tr.setNodeMarkup(pos, undefined, { 
              ...node.attrs, 
              'data-uploading': 'true'
            });
            found = true;
          }
        });
        
        if (found) {
          editor.view.dispatch(tr);
        }
      }, 0);

      try {
        const idToken = await user.getIdToken();
        const imageUrl = await uploadMediaToStorage(file, "attachments", idToken);

        // Find and replace all images with the temp blob URL with the Firebase URL
        const { tr } = editor.state;
        let found = false;
        
        tr.doc.descendants((node, pos) => {
          if (node.type.name === 'image' && node.attrs.src === tempBlobUrl && !found) {
            tr.setNodeMarkup(pos, undefined, { 
              ...node.attrs, 
              src: imageUrl,
              'data-uploading': null
            });
            found = true;
          }
        });
        
        if (found) {
          editor.view.dispatch(tr);
        }
        
        // Clean up the blob URL
        URL.revokeObjectURL(tempBlobUrl);
        
        toast.success("Image uploaded successfully");
      } catch (error) {
        // Find and remove the image node on error
        const { tr } = editor.state;
        let found = false;
        
        tr.doc.descendants((node, pos) => {
          if (node.type.name === 'image' && node.attrs.src === tempBlobUrl && !found) {
            tr.delete(pos, pos + node.nodeSize);
            found = true;
          }
        });
        
        if (found) {
          editor.view.dispatch(tr);
        }
        
        // Clean up the blob URL
        URL.revokeObjectURL(tempBlobUrl);
        
        const errorMessage =
          error instanceof Error ? error.message : "Failed to upload image";
        toast.error(errorMessage);
      }
    };
  };


  if (!editor) {
    return (
      <div className={`border rounded-lg bg-muted/30 ${className}`}>
        <div className="h-32 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rich-text-editor border rounded-lg bg-background ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 rounded-t-lg flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-muted" : ""}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-muted" : ""}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "bg-muted" : ""}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-muted" : ""}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-muted" : ""}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        {!hideImageUpload && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleImageUpload}
              title="Insert Image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </>
        )}
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="min-h-[100px]">
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .rich-text-editor .ProseMirror {
          outline: none;
          min-height: 100px;
          padding: 0.75rem;
          overflow: visible;
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 0.5rem 0;
        }
        .rich-text-editor .ProseMirror img[data-uploading="true"],
        .rich-text-editor .ProseMirror img.uploading-image {
          position: relative;
          opacity: 0.7;
        }
        .rich-text-editor .ProseMirror img[data-uploading="true"]::after,
        .rich-text-editor .ProseMirror img.uploading-image::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rich-text-editor .ProseMirror img[data-uploading="true"]::before,
        .rich-text-editor .ProseMirror img.uploading-image::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: rich-text-image-spin 1s linear infinite;
          z-index: 1;
        }
        @keyframes rich-text-image-spin {
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        .rich-text-editor .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .rich-text-editor .ProseMirror a:hover {
          color: hsl(var(--primary) / 0.8);
        }
        .rich-text-editor .ProseMirror ul,
        .rich-text-editor .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ProseMirror ul li,
        .rich-text-editor .ProseMirror ol li {
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ProseMirror ul li::marker,
        .rich-text-editor .ProseMirror ol li::marker {
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ProseMirror h1,
        .rich-text-editor .ProseMirror h2,
        .rich-text-editor .ProseMirror h3 {
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }
        .rich-text-editor .ProseMirror h1 {
          font-size: 1.5rem;
        }
        .rich-text-editor .ProseMirror h2 {
          font-size: 1.25rem;
        }
        .rich-text-editor .ProseMirror h3 {
          font-size: 1.125rem;
        }
      `}</style>
    </div>
  );
}
