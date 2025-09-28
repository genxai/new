import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import SettingsIcon from "@/components/ui/settings-icon"
import PlusIcon from "@/components/ui/plus-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sections, getColorFromGradient, type Section } from "@/data/sections"

export default function MainPage() {
  const [prompt, setPrompt] = useState("")
  const location = useLocation()
  const navigate = useNavigate()

  const activeSection =
    sections.find((section) => location.pathname.startsWith(section.route)) ||
    sections[0]

  const handleSectionClick = (section: Section) => {
    navigate(section.route)
  }

  return (
    <div className="h-dvh bg-background text-foreground flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex text-xl font-extralight justify-center gap-2 mx-auto items-center h-10">
            <span
              className="scale-y-85 font-[500] bg-clip-text text-transparent flex items-center"
              style={{
                backgroundImage: `linear-gradient(to right, ${activeSection.color.replace(" ", ", ")})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              gen
            </span>
            <span className="text-foreground/80 flex items-center scale-y-85">
              a
            </span>
            <span
              className="scale-y-85 font-[500] bg-clip-text text-transparent flex items-center"
              style={{
                backgroundImage: `linear-gradient(to right, ${activeSection.color.replace(" ", ", ")})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              new
            </span>
            <span className="text-foreground/80 flex items-center scale-y-85">
              {activeSection.genName.toLowerCase()}
            </span>
          </div>

          <div className="relative max-w-xl mx-auto">
            <Input
              type="text"
              placeholder="Background of soft, abstract gradient pastels"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full min-h-24 items-start rounded-[26px] text-lg pr-40 p-3 pb-12 border-0 bg-gray-200/3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.05)] focus-visible:shadow-[inset_0_3px_6px_rgba(0,0,0,0.15),inset_0_1px_3px_rgba(0,0,0,0.08)] dark:focus-visible:shadow-[inset_0_3px_6px_rgba(0,0,0,0.15),inset_0_1px_3px_rgba(0,0,0,0.08)] transition-shadow"
            />

            <div className="absolute right-3 bottom-3 flex items-center gap-4">
              <Button variant="icon" size="md" className="h-8 w-8 rounded-full">
                <PlusIcon />
              </Button>
              <Button variant="icon" size="md" className="h-8 w-8 rounded-full">
                <SettingsIcon />
              </Button>
              <Button
                size="md"
                className="text-sm font-medium text-white px-5 py-1.5 rounded-[12px] transition-all duration-200"
                style={{
                  background: `linear-gradient(to right, ${activeSection.color.replace(" ", ", ")})`,
                  boxShadow: `0px 5px 10px 0px ${getColorFromGradient(activeSection.color)}33, 0px 1px 4px 0px ${getColorFromGradient(activeSection.color)}A5, 0px -0.5px 0px 0px color(display-p3 1 1 1 / 0.10) inset, 0px 0.5px 0px 0px color(display-p3 1 1 1 / 0.20) inset`,
                }}
              >
                Generate
              </Button>
            </div>
          </div>
        </div>
      </main>

      <nav className="border-t border-border/40 px-4 py-4">
        <div className="flex items-center justify-center gap-8">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection.id === section.id

            return (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section)}
                className="flex flex-col items-center cursor-pointer gap-1 p-2"
              >
                <Icon
                  className="h-5 w-5 transition-colors text-muted-foreground/50"
                  style={
                    isActive
                      ? {
                          color: getColorFromGradient(section.color),
                        }
                      : undefined
                  }
                />
                <span
                  className="text-xs font-medium text-muted-foreground/50"
                  style={
                    isActive
                      ? {
                          backgroundImage: `linear-gradient(to right, ${section.color.replace(" ", ", ")})`,
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                          WebkitTextFillColor: "transparent",
                        }
                      : undefined
                  }
                >
                  {section.navName}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
