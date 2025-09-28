import ImagesIcon from "@/components/ui/images-icon"
import VideosIcon from "@/components/ui/videos-icon"
import AudioIcon from "@/components/ui/audio-icon"
import WritingIcon from "@/components/ui/writing-icon"
import CodeIcon from "@/components/ui/code-icon"

export type Section = {
  id: string
  genName: string
  navName: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  route: string
}

export const getColorFromGradient = (gradient: string): string => {
  const colorMap: Record<string, string> = {
    "from-green-500": "#10b981",
    "from-blue-500": "#3b82f6",
    "from-purple-500": "#8b5cf6",
    "from-orange-500": "#f97316",
    "from-indigo-500": "#6366f1",
  }

  const fromColor = gradient.split(" ")[0]
  return colorMap[fromColor] || "currentColor"
}

export const sections: Section[] = [
  {
    id: "image",
    genName: "Image",
    navName: "Images",
    icon: ImagesIcon,
    color: "from-green-500 to-emerald-600",
    route: "/image",
  },
  {
    id: "video",
    genName: "Video",
    navName: "Videos",
    icon: VideosIcon,
    color: "from-blue-500 to-cyan-600",
    route: "/video",
  },
  {
    id: "audio",
    genName: "Audio",
    navName: "Audio",
    icon: AudioIcon,
    color: "from-purple-500 to-violet-600",
    route: "/audio",
  },
  {
    id: "writing",
    genName: "Writing",
    navName: "Writing",
    icon: WritingIcon,
    color: "from-orange-500 to-red-600",
    route: "/writing",
  },
  {
    id: "code",
    genName: "Code",
    navName: "Code",
    icon: CodeIcon,
    color: "from-indigo-500 to-blue-600",
    route: "/code",
  },
]
