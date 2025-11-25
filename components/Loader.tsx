import Orb from "./Orb";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  hue?: number;
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-32 h-32",
};

export default function Loader({ size = "md", hue = 300 }: LoaderProps) {
  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} relative`}>
        <Orb
          hoverIntensity={0.3}
          rotateOnHover={true}
          hue={hue}
          forceHoverState={true}
        />
      </div>
    </div>
  );
}

