"use client";

// Welcome screen scenery (spec §6): a single full-bleed pixel landscape —
// bright sky with cumulus, distant snowy ranges, pine forest, a waterfall
// feeding a lake, a dark forested cliff on the right, mossy stone ruins in the
// foreground and wildflowers. Pure SVG on a crisp grid, no binary assets.
//
// The robot mascot and the wooden signpost are separate exports so the welcome
// page can position them like the reference rather than baking them into the
// landscape.

export function WelcomeScene() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <defs>
        <linearGradient id="wSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ea6dd" />
          <stop offset="34%" stopColor="#79c2ea" />
          <stop offset="58%" stopColor="#a9daf3" />
          <stop offset="72%" stopColor="#cfe9f8" />
        </linearGradient>
        <linearGradient id="wLake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fcdea" />
          <stop offset="100%" stopColor="#4fa3d6" />
        </linearGradient>
      </defs>

      {/* ── Sky ── */}
      <rect width="1600" height="900" fill="url(#wSky)" />

      {/* ── Cumulus (stepped pixel masses, white with a pale blue underside) ── */}
      <g>
        {/* left mass */}
        <g fill="#cfe3f2">
          <rect x="150" y="150" width="520" height="34" />
          <rect x="200" y="122" width="420" height="30" />
        </g>
        <g fill="#ffffff">
          <rect x="168" y="112" width="470" height="40" />
          <rect x="216" y="80" width="360" height="36" />
          <rect x="292" y="52" width="228" height="32" />
          <rect x="120" y="140" width="580" height="26" />
        </g>
        {/* centre mass */}
        <g fill="#cfe3f2">
          <rect x="700" y="196" width="480" height="30" />
        </g>
        <g fill="#ffffff">
          <rect x="716" y="164" width="450" height="38" />
          <rect x="772" y="132" width="330" height="36" />
          <rect x="852" y="106" width="196" height="30" />
        </g>
        {/* right mass */}
        <g fill="#cfe3f2">
          <rect x="1230" y="150" width="330" height="26" />
        </g>
        <g fill="#ffffff">
          <rect x="1252" y="118" width="300" height="36" />
          <rect x="1320" y="92" width="220" height="30" />
        </g>
        {/* wisps */}
        <g fill="#ffffff" opacity="0.75">
          <rect x="520" y="236" width="200" height="16" />
          <rect x="1080" y="252" width="170" height="14" />
          <rect x="60" y="256" width="180" height="14" />
        </g>
      </g>

      {/* Everything from here down is drawn 150px higher than the raw
          coordinates say, so the horizon sits where the reference puts it
          (~38% down the frame) rather than ~60%. The sky and clouds stay put,
          and the band below y=750 is filled separately afterwards so the
          landscape still reaches the bottom edge. */}
      <g transform="translate(0,-190)">
      {/* ── Far snowy range ── (raised a further 40 so the peaks sit high) */}
      <g transform="translate(0,40)">
        <polygon
          points="120,470 250,330 330,392 460,262 560,352 640,300 760,214 900,330 1010,262 1130,360 1240,300 1360,420 1440,470 120,470"
          fill="#9dc2dd"
        />
        <g fill="#ffffff">
          <polygon points="460,262 520,330 500,344 470,318 440,344 420,330" />
          <polygon points="760,214 838,318 812,334 768,292 726,334 700,318" />
          <polygon points="1010,262 1074,348 1050,362 1012,326 976,362 952,348" />
          <polygon points="250,330 306,398 286,410 252,380 220,410 200,398" />
          <polygon points="1240,300 1306,392 1282,404 1242,368 1204,404 1182,392" />
        </g>
        <polygon points="120,470 1440,470 1440,560 120,560" fill="#8ab2d2" />
      </g>

      {/* ── Near range (darker, closer) ── */}
      <g>
        <polygon
          points="0,560 90,470 190,530 300,440 430,540 520,486 660,560 0,560"
          fill="#6d9cbe"
        />
        <g fill="#e8f3fb">
          <polygon points="300,440 352,502 332,514 302,486 274,514 252,502" />
          <polygon points="90,470 138,522 120,532 92,510 66,532 48,522" />
        </g>
        <polygon points="1180,560 1290,454 1392,520 1500,432 1600,520 1600,560 1180,560" fill="#5f8cb0" />
        <g fill="#e8f3fb">
          <polygon points="1500,432 1552,494 1532,506 1502,478 1474,506 1452,494" />
        </g>
      </g>

      {/* ── Mid forest band ── */}
      <g>
        <polygon points="0,640 160,556 320,624 470,548 640,632 800,560 960,640 1120,568 1300,648 1450,588 1600,652 1600,700 0,700" fill="#2f6b48" />
        <polygon points="0,700 200,628 400,690 620,616 840,694 1060,624 1280,694 1480,634 1600,690 1600,740 0,740" fill="#245639" />
        {/* pine spires */}
        <g fill="#1d4a31">
          <polygon points="106,600 130,548 154,600" />
          <polygon points="188,628 212,570 236,628" />
          <polygon points="498,596 522,540 546,596" />
          <polygon points="742,614 766,556 790,614" />
          <polygon points="1128,612 1152,556 1176,612" />
          <polygon points="1348,640 1372,586 1396,640" />
        </g>
        <g fill="#153c27">
          <polygon points="270,614 292,562 314,614" />
          <polygon points="884,610 906,558 928,610" />
          <polygon points="1452,628 1474,578 1496,628" />
        </g>
      </g>

      {/* ── Waterfall feeding the lake ── */}
      <g>
        <polygon points="962,470 1074,470 1074,660 962,660" fill="#1c4a34" />
        <rect x="984" y="486" width="70" height="182" fill="#d8eefb" />
        <rect x="1000" y="486" width="38" height="182" fill="#ffffff" />
        <g fill="#bfe0f4">
          <rect x="990" y="520" width="8" height="120" />
          <rect x="1042" y="540" width="8" height="104" />
        </g>
        {/* mist at the base */}
        <g fill="#ffffff" opacity="0.7">
          <rect x="968" y="648" width="26" height="12" />
          <rect x="1010" y="640" width="30" height="12" />
          <rect x="1048" y="654" width="24" height="10" />
        </g>
      </g>

      {/* ── Lake ── */}
      <g>
        <polygon points="600,660 1330,660 1400,740 1500,800 1180,880 700,880 520,800 560,720" fill="url(#wLake)" />
        <g fill="#a8dcf4" opacity="0.85">
          <rect x="700" y="694" width="420" height="8" />
          <rect x="640" y="726" width="300" height="7" />
          <rect x="900" y="742" width="380" height="7" />
          <rect x="760" y="778" width="500" height="7" />
          <rect x="660" y="812" width="340" height="7" />
          <rect x="1080" y="806" width="260" height="7" />
        </g>
        {/* island */}
        <polygon points="1052,700 1116,690 1170,706 1150,722 1072,722" fill="#2f6b48" />
        <g fill="#1d4a31">
          <polygon points="1082,700 1096,676 1110,700" />
          <polygon points="1112,702 1126,680 1140,702" />
        </g>
      </g>

      {/* ── Right cliff / forested mountain ── */}
      <g>
        <polygon points="1290,900 1330,560 1420,470 1520,420 1600,400 1600,900" fill="#1f4a32" />
        <polygon points="1330,900 1372,620 1462,540 1540,506 1600,492 1600,900" fill="#173d28" />
        <g fill="#4a3a2a" opacity="0.55">
          <polygon points="1400,640 1444,610 1470,676 1426,704" />
          <polygon points="1508,586 1556,566 1576,634 1528,650" />
        </g>
        {/* tall foreground pine */}
        <g fill="#173d28">
          <polygon points="1452,760 1512,470 1572,760" />
          <polygon points="1470,640 1512,430 1554,640" />
          <polygon points="1486,530 1512,360 1538,530" />
          <rect x="1504" y="756" width="16" height="60" fill="#3a2a1a" />
        </g>
      </g>

      {/* ── Foreground ground ── */}
      <g>
        <polygon points="0,760 400,720 900,742 1300,726 1600,760 1600,900 0,900" fill="#3d7a49" />
        <polygon points="0,810 300,772 700,796 1150,778 1600,812 1600,900 0,900" fill="#2c5c37" />
        <g fill="#4e8f58" opacity="0.7">
          <rect x="120" y="784" width="180" height="8" />
          <rect x="640" y="768" width="240" height="8" />
          <rect x="1080" y="776" width="200" height="8" />
        </g>
      </g>

      {/* ── Mossy stone ruins (bottom-left) ── */}
      <g>
        <g fill="#a99f8a">
          <rect x="60" y="792" width="180" height="52" />
          <rect x="280" y="820" width="160" height="48" />
          <rect x="40" y="856" width="300" height="44" />
        </g>
        <g fill="#cdc4b0">
          <rect x="72" y="776" width="156" height="40" />
          <rect x="292" y="806" width="136" height="36" />
          <rect x="52" y="840" width="276" height="34" />
          <rect x="200" y="700" width="150" height="56" />
          <rect x="214" y="684" width="122" height="34" />
        </g>
        <g fill="#7d7563" opacity="0.5">
          <rect x="72" y="810" width="156" height="6" />
          <rect x="292" y="836" width="136" height="6" />
          <rect x="200" y="748" width="150" height="8" />
        </g>
        <g fill="#4a7a4a">
          <rect x="72" y="772" width="156" height="10" />
          <rect x="200" y="696" width="150" height="10" />
          <rect x="52" y="836" width="120" height="8" />
          <rect x="292" y="802" width="136" height="8" />
        </g>
      </g>

      {/* ── Wildflowers ── */}
      <g>
        <g fill="#e85d9b">
          <rect x="150" y="862" width="6" height="6" />
          <rect x="176" y="874" width="5" height="5" />
          <rect x="470" y="844" width="6" height="6" />
          <rect x="946" y="826" width="5" height="5" />
          <rect x="1214" y="856" width="6" height="6" />
        </g>
        <g fill="#ffffff">
          <rect x="132" y="880" width="5" height="5" />
          <rect x="300" y="866" width="5" height="5" />
          <rect x="520" y="856" width="5" height="5" />
          <rect x="1010" y="846" width="5" height="5" />
          <rect x="1330" y="840" width="5" height="5" />
        </g>
        <g fill="#f5c542">
          <rect x="210" y="892" width="5" height="5" />
          <rect x="392" y="878" width="5" height="5" />
          <rect x="884" y="852" width="5" height="5" />
          <rect x="1150" y="828" width="5" height="5" />
        </g>
        <g fill="#4e8f58">
          <rect x="150" y="868" width="2" height="14" />
          <rect x="470" y="850" width="2" height="14" />
          <rect x="946" y="832" width="2" height="12" />
        </g>
      </g>
      </g>

      {/* ── Unshifted fill so the land still reaches the bottom edge ── */}
      <rect x="0" y="700" width="1600" height="200" fill="#3d7a49" />
      <rect x="0" y="712" width="1600" height="188" fill="#2c5c37" />
      <rect x="1290" y="700" width="310" height="200" fill="#173d28" />
      <g fill="#4e8f58" opacity="0.6">
        <rect x="120" y="724" width="200" height="8" />
        <rect x="640" y="716" width="260" height="8" />
        <rect x="1040" y="722" width="180" height="8" />
      </g>
    </svg>
  );
}

/** Pale pixel agent mascot holding a clipboard — the welcome screen's host. */
export function RobotMascot({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 250"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {/* sprout antenna */}
      <rect x="105" y="42" width="8" height="26" fill="#9aa8b2" />
      <g fill="#4ea86b">
        <rect x="86" y="24" width="22" height="16" rx="6" />
        <rect x="110" y="14" width="24" height="16" rx="6" />
        <rect x="96" y="38" width="12" height="10" />
      </g>
      <circle cx="130" cy="22" r="5" fill="#eef4f8" />

      {/* head */}
      <rect x="46" y="64" width="128" height="88" rx="22" fill="#eef4f8" />
      <rect x="46" y="64" width="128" height="88" rx="22" fill="none" stroke="#a9b8c4" strokeWidth="4" />
      <rect x="60" y="80" width="100" height="58" rx="14" fill="#cfdde8" />
      {/* eyes */}
      <rect x="74" y="94" width="26" height="30" rx="9" fill="#4fc9e8" />
      <rect x="112" y="94" width="26" height="30" rx="9" fill="#4fc9e8" />
      <rect x="80" y="100" width="6" height="6" fill="#ffffff" />
      <rect x="118" y="100" width="6" height="6" fill="#ffffff" />
      {/* smile */}
      <rect x="96" y="130" width="20" height="5" fill="#a9b8c4" />
      {/* ears */}
      <rect x="34" y="98" width="14" height="26" rx="6" fill="#cfdde8" />
      <rect x="172" y="98" width="14" height="26" rx="6" fill="#cfdde8" />

      {/* body */}
      <rect x="58" y="152" width="104" height="82" rx="18" fill="#eef4f8" />
      <rect x="58" y="152" width="104" height="82" rx="18" fill="none" stroke="#a9b8c4" strokeWidth="4" />
      <rect x="84" y="170" width="52" height="40" rx="8" fill="#cfdde8" />
      <rect x="98" y="184" width="24" height="10" rx="4" fill="#4ea86b" />
      {/* arms */}
      <rect x="30" y="160" width="26" height="52" rx="12" fill="#eef4f8" />
      <rect x="30" y="160" width="26" height="52" rx="12" fill="none" stroke="#a9b8c4" strokeWidth="4" />
      <rect x="164" y="160" width="26" height="52" rx="12" fill="#eef4f8" />
      <rect x="164" y="160" width="26" height="52" rx="12" fill="none" stroke="#a9b8c4" strokeWidth="4" />
      {/* legs */}
      <rect x="80" y="228" width="24" height="22" rx="9" fill="#cfdde8" />
      <rect x="116" y="228" width="24" height="22" rx="9" fill="#cfdde8" />

      {/* clipboard held in the right hand */}
      <g transform="rotate(-9 186 190)">
        <rect x="164" y="150" width="56" height="76" rx="6" fill="#8a5a32" />
        <rect x="170" y="158" width="44" height="60" rx="4" fill="#d8c096" />
        <rect x="178" y="168" width="28" height="5" fill="#8a6b45" />
        <rect x="178" y="182" width="28" height="5" fill="#8a6b45" />
        <rect x="178" y="196" width="20" height="5" fill="#8a6b45" />
        <rect x="180" y="142" width="24" height="12" rx="4" fill="#c2a06e" />
      </g>
    </svg>
  );
}

/** Wooden signpost: "A BRIGHTER TOMORROW BUILT BY AGENTS". */
export function WoodSign({ className = "" }: { className?: string }) {
  const planks = ["A BRIGHTER", "TOMORROW", "BUILT BY", "AGENTS"];
  return (
    <svg className={className} viewBox="0 0 280 340" shapeRendering="crispEdges" aria-hidden>
      {/* post */}
      <rect x="126" y="120" width="26" height="220" fill="#6b4526" />
      <rect x="126" y="120" width="8" height="220" fill="#553318" />
      <rect x="146" y="120" width="6" height="220" fill="#7d5433" />
      {/* brace */}
      <rect x="106" y="112" width="66" height="16" fill="#553318" />

      <g transform="rotate(-4 140 95)">
        {planks.map((label, i) => (
          <g key={label}>
            <rect x="12" y={i * 46} width="256" height="42" rx="4" fill="#7a5330" />
            <rect x="12" y={i * 46} width="256" height="42" rx="4" fill="none" stroke="#553318" strokeWidth="4" />
            <rect x="20" y={i * 46 + 6} width="240" height="4" fill="#8d6440" opacity="0.6" />
            <text
              x="140"
              y={i * 46 + 27}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-pixel"
              fontSize="17"
              fill="#f3e9d8"
              letterSpacing="1"
            >
              {label}
            </text>
          </g>
        ))}
      </g>
      {/* post top */}
      <rect x="120" y="104" width="38" height="18" rx="4" fill="#7a5330" />
      <rect x="120" y="104" width="38" height="18" rx="4" fill="none" stroke="#553318" strokeWidth="3" />
    </svg>
  );
}
