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
    "#00ac9a": "#70c657",
    "#9a27ad": "#fc2b61",
    "#ff459c": "#ff7c08",
    "#533bcc": "#8a40ca",
    "#6762ff": "#00c0ca",
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
    color: "#00ac9a #70c657",
    route: "/image",
  },
  {
    id: "video",
    genName: "Video",
    navName: "Videos",
    icon: VideosIcon,
    color: "#9a27ad #fc2b61",
    route: "/video",
  },
  {
    id: "audio",
    genName: "Audio",
    navName: "Audio",
    icon: AudioIcon,
    color: "#ff459c #ff7c08",
    route: "/audio",
  },
  {
    id: "writing",
    genName: "Writing",
    navName: "Writing",
    icon: WritingIcon,
    color: "#533bcc #8a40ca",
    route: "/writing",
  },
  {
    id: "code",
    genName: "Code",
    navName: "Code",
    icon: CodeIcon,
    color: "#6762ff #00c0ca",
    route: "/code",
  },
]
