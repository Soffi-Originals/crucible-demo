import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { PlanCard } from '@/components/views/PlanCard'
import { plans } from '@/data/demo'

// ---------------------------------------------------------------------------
// Per-tier illustrated banners
// ---------------------------------------------------------------------------

function SandboxBanner() {
  return (
    <svg
      viewBox="0 0 400 128"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sb-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#c7d2fe" />
        </linearGradient>
        <linearGradient id="sb-grid-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="400" height="128" fill="url(#sb-bg)" />

      {/* Isometric grid — horizontal lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={32 + i * 20}
          x2={400}
          y2={32 + i * 20}
          stroke="#93c5fd"
          strokeWidth="0.75"
          strokeOpacity="0.55"
        />
      ))}
      {/* Vertical lines */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <line
          key={`v${i}`}
          x1={i * 40}
          y1={22}
          x2={i * 40}
          y2={116}
          stroke="#93c5fd"
          strokeWidth="0.75"
          strokeOpacity="0.55"
        />
      ))}

      {/* Three floating "eval block" cubes (isometric) */}
      {/* Cube 1 — left */}
      <g transform="translate(72, 48)">
        <polygon points="0,-18 18,-9 18,9 0,18 -18,9 -18,-9" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" />
        <polygon points="0,-18 18,-9 18,9 0,0" fill="#93c5fd" fillOpacity="0.55" />
        <polygon points="0,-18 -18,-9 -18,9 0,0" fill="#60a5fa" fillOpacity="0.3" />
        <polygon points="0,0 18,9 18,27 0,18 -18,27 -18,9" fill="#dbeafe" fillOpacity="0.8" stroke="#93c5fd" strokeWidth="0.75" />
      </g>

      {/* Cube 2 — center, taller */}
      <g transform="translate(200, 38)">
        <polygon points="0,-24 20,-12 20,12 0,24 -20,12 -20,-12" fill="#c7d2fe" stroke="#a5b4fc" strokeWidth="1" />
        <polygon points="0,-24 20,-12 20,12 0,0" fill="#a5b4fc" fillOpacity="0.6" />
        <polygon points="0,-24 -20,-12 -20,12 0,0" fill="#818cf8" fillOpacity="0.3" />
        <polygon points="0,0 20,12 20,36 0,24 -20,36 -20,12" fill="#e0e7ff" fillOpacity="0.85" stroke="#a5b4fc" strokeWidth="0.75" />
        {/* Checkmark on top face */}
        <polyline points="-5,0 -1,5 8,-5" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Cube 3 — right, small */}
      <g transform="translate(320, 58)">
        <polygon points="0,-14 14,-7 14,7 0,14 -14,7 -14,-7" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" />
        <polygon points="0,-14 14,-7 14,7 0,0" fill="#93c5fd" fillOpacity="0.45" />
        <polygon points="0,-14 -14,-7 -14,7 0,0" fill="#60a5fa" fillOpacity="0.25" />
        <polygon points="0,0 14,7 14,21 0,14 -14,21 -14,7" fill="#dbeafe" fillOpacity="0.8" stroke="#93c5fd" strokeWidth="0.75" />
      </g>

      {/* Fade vignette at bottom */}
      <rect width="400" height="128" fill="url(#sb-grid-fade)" />
    </svg>
  )
}

function TeamBanner() {
  // Node positions
  const nodes: [number, number][] = [
    [200, 54],  // center
    [108, 30],  // top-left
    [292, 30],  // top-right
    [82, 88],   // bottom-left
    [318, 88],  // bottom-right
    [200, 100], // bottom-center
    [148, 62],  // inner left
    [252, 62],  // inner right
  ]
  // Edges (index pairs)
  const edges = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
    [0, 6], [0, 7],
    [1, 6], [2, 7], [6, 3], [7, 4], [6, 7],
    [3, 5], [4, 5],
  ]

  return (
    <svg
      viewBox="0 0 400 128"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5d0fe" />
          <stop offset="100%" stopColor="#fce7f3" />
        </linearGradient>
        <radialGradient id="tm-glow" cx="50%" cy="42%" r="38%">
          <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#f5d0fe" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tm-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <rect width="400" height="128" fill="url(#tm-bg)" />
      <rect width="400" height="128" fill="url(#tm-glow)" />

      {/* Edges */}
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="#e879f9"
          strokeWidth="1"
          strokeOpacity="0.35"
        />
      ))}

      {/* Outer nodes */}
      {[1, 2, 3, 4, 5].map((idx) => (
        <circle
          key={idx}
          cx={nodes[idx][0]}
          cy={nodes[idx][1]}
          r="5"
          fill="#f0abfc"
          stroke="#e879f9"
          strokeWidth="1"
          fillOpacity="0.8"
        />
      ))}

      {/* Inner ring nodes */}
      {[6, 7].map((idx) => (
        <circle
          key={idx}
          cx={nodes[idx][0]}
          cy={nodes[idx][1]}
          r="6"
          fill="#e879f9"
          stroke="#d946ef"
          strokeWidth="1"
          fillOpacity="0.75"
        />
      ))}

      {/* Center hub */}
      <circle cx={nodes[0][0]} cy={nodes[0][1]} r="13" fill="#f5d0fe" stroke="#e879f9" strokeWidth="1.5" />
      <circle cx={nodes[0][0]} cy={nodes[0][1]} r="8" fill="#e879f9" fillOpacity="0.7" />
      {/* Center crown / star symbol */}
      <text
        x={nodes[0][0]}
        y={nodes[0][1] + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="8"
        fill="white"
        fontFamily="ui-sans-serif, sans-serif"
        fontWeight="700"
      >✦</text>

      {/* Pulse ring */}
      <circle cx={nodes[0][0]} cy={nodes[0][1]} r="20" fill="none" stroke="#e879f9" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="3 4" />

      <rect width="400" height="128" fill="url(#tm-fade)" />
    </svg>
  )
}

function EnterpriseBanner() {
  return (
    <svg
      viewBox="0 0 400 128"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="en-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0e7ff" />
          <stop offset="100%" stopColor="#fae8ff" />
        </linearGradient>
        <radialGradient id="en-globe-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.15" />
        </radialGradient>
        <linearGradient id="en-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0.5" />
        </linearGradient>
        <clipPath id="en-globe-clip">
          <circle cx="200" cy="62" r="46" />
        </clipPath>
      </defs>

      <rect width="400" height="128" fill="url(#en-bg)" />

      {/* Globe body */}
      <circle cx="200" cy="62" r="46" fill="url(#en-globe-grad)" stroke="#a5b4fc" strokeWidth="1.5" />

      {/* Latitude lines */}
      {[-24, 0, 24].map((dy, i) => {
        const halfW = Math.sqrt(Math.max(0, 46 * 46 - dy * dy))
        return (
          <ellipse
            key={i}
            cx="200"
            cy={62 + dy}
            rx={halfW}
            ry={halfW * 0.28}
            fill="none"
            stroke="#818cf8"
            strokeWidth="0.75"
            strokeOpacity="0.5"
          />
        )
      })}

      {/* Longitude lines */}
      {[-1, 0, 1].map((i) => (
        <ellipse
          key={i}
          cx="200"
          cy="62"
          rx={i === 0 ? 46 : 28}
          ry="46"
          fill="none"
          stroke="#818cf8"
          strokeWidth="0.75"
          strokeOpacity="0.45"
          transform={i !== 0 ? `rotate(${i * 38}, 200, 62)` : undefined}
        />
      ))}

      {/* Continent-like blobs (abstract) */}
      <g clipPath="url(#en-globe-clip)">
        <ellipse cx="184" cy="52" rx="18" ry="11" fill="#6366f1" fillOpacity="0.22" />
        <ellipse cx="218" cy="68" rx="14" ry="9" fill="#6366f1" fillOpacity="0.2" />
        <ellipse cx="196" cy="80" rx="9" ry="6" fill="#6366f1" fillOpacity="0.18" />
      </g>

      {/* Orbiting ring */}
      <ellipse cx="200" cy="62" rx="62" ry="16" fill="none" stroke="#a5b4fc" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="4 3" transform="rotate(-18, 200, 62)" />

      {/* Three orbital dots */}
      {[0, 120, 240].map((angle, i) => {
        const rad = ((angle - 18) * Math.PI) / 180
        // parametric point on the rotated ellipse (rx=62, ry=16, rotation=-18°)
        const cosR = Math.cos(-18 * Math.PI / 180)
        const sinR = Math.sin(-18 * Math.PI / 180)
        const px = 62 * Math.cos(rad)
        const py = 16 * Math.sin(rad)
        const x = 200 + px * cosR - py * sinR
        const y = 62 + px * sinR + py * cosR
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill="#818cf8"
            stroke="#6366f1"
            strokeWidth="1"
            fillOpacity="0.85"
          />
        )
      })}

      {/* Shield badge at top-right */}
      <g transform="translate(302, 22)">
        {/* Shield shape */}
        <path
          d="M0,-14 L12,-8 L12,4 Q12,14 0,18 Q-12,14 -12,4 L-12,-8 Z"
          fill="#c7d2fe"
          stroke="#818cf8"
          strokeWidth="1.2"
        />
        {/* Checkmark */}
        <polyline
          points="-4,2 -1,6 5,-3"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <rect width="400" height="128" fill="url(#en-fade)" />
    </svg>
  )
}

const planBanners: Record<string, React.ReactNode> = {
  free: <SandboxBanner />,
  team: <TeamBanner />,
  enterprise: <EnterpriseBanner />,
}

export function PlansPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-1">
        <Heading as="h1" size="xl" weight="semibold" className="sm:text-2xl">
          Plans & billing
        </Heading>
        <Text size="sm" tone="muted">
          You're currently on the Sandbox plan. Upgrade to ship agents to
          production.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            name={plan.name}
            price={plan.price}
            pricePeriod={plan.pricePeriod}
            description={plan.description}
            features={plan.features}
            ctaLabel={plan.ctaLabel}
            badge={plan.badge}
            badgeTone={plan.featured ? 'accent' : 'neutral'}
            featured={plan.featured}
            tier={
              plan.id === 'free'
                ? 'free'
                : plan.id === 'team'
                  ? 'pro'
                  : 'enterprise'
            }
            banner={planBanners[plan.id]}
          />
        ))}
      </div>
    </div>
  )
}
