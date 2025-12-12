import { User, Folder, Users, Clock, Pin } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/AuthProvider"
import { useEffect, useState } from "react"
import { Recents as RecentsType } from "@/types/recents"
import { motion } from "framer-motion"
import { apiGet } from "@/lib/api/apiClient"
import Image from "next/image"

// Menu items
const items = [
  {
    title: "For You",
    url: "/",
    icon: User,
  },
  {
    title: "Teams",
    url: "/teams",
    icon: Users,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: Folder,
  },
]

export function SideBar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const { user } = useAuth()
  const [recentProjects, setRecentProjects] = useState<RecentsType[]>([])
  const [pinnedProjects, setPinnedProjects] = useState<any[]>([])
  
  const fetchRecentProjects = async (): Promise<RecentsType[]> => {
    try {
      if (!user) {
        return [];
      }
      const idToken = await user.getIdToken();

      const response = await apiGet("/api/recents?type=projects&limit=5", idToken)
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching recents:", error);
      return [];
    }
  };

  const fetchPinnedProjects = async (): Promise<any[]> => {
    try {
      if (!user) {
        return [];
      }
      const idToken = await user.getIdToken();

      const response = await apiGet("/api/pinned-projects?limit=5", idToken)
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching pinned projects:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchRecentProjects().then((data) => setRecentProjects(data))
    fetchPinnedProjects().then((data) => setPinnedProjects(data))
  }, [user])

  return (
    <Sidebar className="border-r border-border/40 dark:bg-card/30 dark:backdrop-blur-xl">
      <SidebarHeader className="border-b border-border/40 h-16 flex items-center px-4">
        <motion.div
          className={`flex items-center gap-3 transition-all duration-300 ease-in-out ${
            state === "collapsed" ? "opacity-0 scale-90" : "opacity-100 scale-100"
          }`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-center size-9 rounded-xl bg-linear-to-br from-primary/90 to-primary text-primary-foreground font-bold text-sm shadow-lg dark:shadow-primary/20">
            CT
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight">
              Codeable Tickets
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Task Management
            </span>
          </div>
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <SidebarMenu className="gap-1">
                {items.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={item.url === pathname}
                        className="h-10 px-3 rounded-lg font-medium hover:bg-primary/10 dark:hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 dark:data-[active=true]:bg-primary/20 data-[active=true]:text-primary dark:data-[active=true]:text-primary data-[active=true]:shadow-sm"
                      >
                        <Link href={item.url} className="flex items-center gap-3">
                          <item.icon className="w-[18px] h-[18px]" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                ))}
              </SidebarMenu>
            </motion.div>
          </SidebarGroupContent>
        </SidebarGroup>

        {pinnedProjects && pinnedProjects.length > 0 && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
              <Pin className="w-3 h-3" />
              Pinned Projects
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {pinnedProjects.map((pinnedItem, i) => {
                  const project = pinnedItem.project || pinnedItem;
                  if (!project || !project._id) return null;
                  
                  return (
                    <motion.div
                      key={project._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                    >
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={`/project/${project._id}` === pathname}
                          className="h-10 px-3 rounded-lg font-medium hover:bg-primary/10 dark:hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 dark:data-[active=true]:bg-primary/20 data-[active=true]:text-primary dark:data-[active=true]:text-primary data-[active=true]:shadow-sm"
                        >
                          <Link href={`/project/${project._id}`} className="flex items-center gap-3">
                            {project.img ? (
                              <Image
                                src={project.img}
                                alt={project.title || 'Project'}
                                width={18}
                                height={18}
                                className="w-[18px] h-[18px] rounded-md object-cover ring-1 ring-border/20"
                              />
                            ) : (
                              <div className="w-[18px] h-[18px] bg-linear-to-br from-primary/20 to-primary/10 rounded-md flex items-center justify-center ring-1 ring-primary/20">
                                <span className="text-primary font-bold text-[9px]">
                                  {project.code?.slice(0, 2) || (project.title ? project.title.slice(0, 2).toUpperCase() : "PR")}
                                </span>
                              </div>
                            )}
                            <span className="truncate text-sm">{project.title || 'Untitled'}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </motion.div>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {recentProjects && recentProjects.length > 0 && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Recent Projects
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {recentProjects.map((project, i) => (
                  <motion.div
                    key={project.resourceId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={`/project/${project.resourceId}` === pathname}
                        className="h-10 px-3 rounded-lg font-medium hover:bg-primary/10 dark:hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 dark:data-[active=true]:bg-primary/20 data-[active=true]:text-primary dark:data-[active=true]:text-primary data-[active=true]:shadow-sm"
                      >
                        <Link href={`/project/${project.resourceId}`} className="flex items-center gap-3">
                          {project.img ? (
                            <Image
                              src={project.img}
                              alt={project.title}
                              width={18}
                              height={18}
                              className="w-[18px] h-[18px] rounded-md object-cover ring-1 ring-border/20"
                            />
                          ) : (
                            <div className="w-[18px] h-[18px] bg-linear-to-br from-primary/20 to-primary/10 rounded-md flex items-center justify-center ring-1 ring-primary/20">
                              <span className="text-primary font-bold text-[9px]">
                                {(project as any).code?.slice(0, 2) || (project.title ? project.title.slice(0, 2).toUpperCase() : "PR")}
                              </span>
                            </div>
                          )}
                          <span className="truncate text-sm">{project.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
