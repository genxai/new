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
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex text-[52px] font-extralight justify-center gap-2 mx-auto">
            <span
              className={`bg-gradient-to-r ${activeSection.color} scale-y-85 font-[500] bg-clip-text text-transparent`}
            >
              gen
            </span>
            <span className="text-foreground/80 text-[48px]">a</span>
            <span
              className={`bg-gradient-to-r ${activeSection.color} scale-y-85 font-[500] bg-clip-text text-transparent`}
            >
              new
            </span>
            <span className="text-foreground/80">
              {activeSection.genName.toLowerCase()}
            </span>
          </div>

          <div className="relative max-w-xl mx-auto">
            <Input
              type="text"
              placeholder="Background of soft, abstract gradient pastels"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full min-h-24 items-start rounded-[26px] text-lg pr-40 pt-3 pb-12 border-0 bg-gray-50/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.05)] focus-visible:shadow-[inset_0_3px_6px_rgba(0,0,0,0.15),inset_0_1px_3px_rgba(0,0,0,0.08)] dark:focus-visible:shadow-[inset_0_3px_6px_rgba(0,0,0,0.15),inset_0_1px_3px_rgba(0,0,0,0.08)] transition-shadow"
            />

            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <Button
                variant="icon"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <PlusIcon />
              </Button>
              <Button
                variant="icon"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <SettingsIcon />
              </Button>
              <Button
                size="md"
                className={`text-sm font-medium bg-gradient-to-r ${activeSection.color} hover:opacity-90 px-4 py-1 transition-opacity`}
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
                  className="h-5 w-5 transition-colors text-muted-foreground/50 hover:text-foreground"
                  style={
                    isActive
                      ? { color: getColorFromGradient(section.color) }
                      : undefined
                  }
                />
                <span
                  className="text-xs font-medium"
                  style={
                    isActive
                      ? { color: getColorFromGradient(section.color) }
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
