import { useState } from "react"
import { NavLink, useLocation, useOutlet } from "react-router-dom"
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion"
import { BookOpen, Layers, Library, Plus } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

const links = [
  { to: "/", label: "Review", icon: BookOpen },
  { to: "/collection", label: "Collection", icon: Library },
  { to: "/cards", label: "Swipe", icon: Layers },
]

const spring = { type: "spring", stiffness: 500, damping: 38 } as const

function FrozenOutlet() {
  const outlet = useOutlet()
  const [frozen] = useState(outlet)
  return <>{frozen}</>
}

function Logo() {
  return (
    <NavLink to="/" className="text-3xl font-semibold tracking-tight sm:text-4xl">
      lingora<span className="text-violet-400">.</span>
    </NavLink>
  )
}

/** Navegación desktop: la "píldora" activa se desliza entre links. */
function DesktopNav() {
  const { pathname } = useLocation()
  const hideAdd = pathname.startsWith("/add")

  return (
    <nav className="hidden items-center gap-1 sm:flex" aria-label="Principal">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === "/"}
          className={({ isActive }) =>
            cn(
              "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors outline-none",
              "focus-visible:ring-2 focus-visible:ring-violet-400/70",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="desktop-nav-pill"
                  transition={spring}
                  className="absolute inset-0 rounded-md bg-secondary"
                />
              )}
              <span className="relative z-10">{l.label}</span>
            </>
          )}
        </NavLink>
      ))}
      {!hideAdd && (
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="ml-2">
          <NavLink
            to="/add"
            className="inline-flex items-center gap-1.5 rounded-md bg-violet-500 px-3 py-1.5 text-sm font-medium text-white transition-colors outline-none hover:bg-violet-400 focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            <Plus className="size-4" />
            Add entry
          </NavLink>
        </motion.div>
      )}
    </nav>
  )
}

/** Navegación mobile: barra inferior estilo app + botón flotante para agregar. */
function MobileNav() {
  const { pathname } = useLocation()
  const hideFab = pathname.startsWith("/cards") || pathname.startsWith("/add")

  return (
    <>
      <AnimatePresence>
        {!hideFab && (
          <motion.div
            key="fab"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.92 }}
            transition={{ ...spring, delay: 0.15 }}
            className="fixed right-4 z-50 sm:hidden"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 5.25rem)" }}
          >
            <NavLink
              to="/add"
              aria-label="Add entry"
              className="flex size-14 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/30 outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            >
              <Plus className="size-6" />
            </NavLink>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/80 backdrop-blur-lg sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-3xl items-stretch justify-around px-2">
          {links.map((l) => (
            <li key={l.to} className="flex-1">
              <NavLink
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "relative flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors outline-none",
                    "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400/70",
                    isActive ? "text-violet-400" : "text-muted-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <motion.span
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center gap-1"
                  >
                    {isActive && (
                      <motion.span
                        layoutId="mobile-nav-indicator"
                        transition={spring}
                        className="absolute -top-px h-0.5 w-8 rounded-full bg-violet-400"
                      />
                    )}
                    <l.icon className="size-5" />
                    {l.label}
                  </motion.span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}

export function Layout() {
  const location = useLocation()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)

  useMotionValueEvent(scrollY, "change", (y: number) => setScrolled(y > 8))

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4">
        <header
          className={cn(
            "sticky top-0 z-30 -mx-4 flex items-center justify-between gap-3 border-b px-4 py-4 backdrop-blur-lg transition-[background-color,border-color] duration-200 sm:py-5",
            scrolled
              ? "border-border/60 bg-background/80"
              : "border-transparent bg-transparent"
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Logo />
          </motion.div>
          <DesktopNav />
        </header>

        <main className="relative flex-1 pt-2 pb-32 sm:pb-12">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <FrozenOutlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileNav />
    </MotionConfig>
  )
}