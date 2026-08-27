/*
 * graph-data.js — MEKANISK AVLEDET fra /connections-graph-v2.json (D47).
 * Endres aldri for hånd; kilden er JSON-fila på rotnivå. Innebygd som
 * ES-modul fordi prototypen åpnes via file:// der fetch() er blokkert.
 */
export default {
  "_meta": {
    "sourceCommit": "410a365d47de5c7a1542edc71d0336cd5b7d1b56",
    "source": "connections-map.js",
    "nodeCount": 24,
    "edgeCount": 38,
    "typeVocabulary": [
      "direct",
      "coupled",
      "modeled"
    ],
    "strengthVocabulary": [
      "primary",
      "contributing",
      "contextual",
      "variable"
    ],
    "version": "v2"
  },
  "layers": [
    {
      "id": "geometry",
      "displayName": "Geometry",
      "nodeIds": [
        "plane",
        "direction",
        "lowpoint",
        "ballposition",
        "archeight"
      ]
    },
    {
      "id": "delivery",
      "displayName": "Delivery",
      "nodeIds": [
        "attack",
        "path",
        "face",
        "loft",
        "speed",
        "strike"
      ]
    },
    {
      "id": "separation",
      "displayName": "Separation",
      "nodeIds": [
        "spinloft",
        "spinaxis",
        "launchdir",
        "launchangle",
        "ballspeed",
        "verticalspinloft"
      ]
    },
    {
      "id": "flight",
      "displayName": "Flight",
      "nodeIds": [
        "backspin",
        "curve",
        "apex",
        "carry"
      ]
    },
    {
      "id": "landing",
      "displayName": "Landing",
      "nodeIds": [
        "landingangle",
        "side",
        "total"
      ]
    }
  ],
  "nodes": [
    {
      "id": "plane",
      "layer": "geometry",
      "displayName": "Swing Plane",
      "role": "Geometry input · Studio",
      "explanation": "The tilted surface that turns circular motion into delivery."
    },
    {
      "id": "direction",
      "layer": "geometry",
      "displayName": "Swing Direction",
      "role": "Geometry input · Studio",
      "explanation": "The direction the swing plane points through the target frame."
    },
    {
      "id": "lowpoint",
      "layer": "geometry",
      "displayName": "Low Point",
      "role": "Geometry input · Studio",
      "explanation": "Where the swing arc reaches its bottom relative to the ball."
    },
    {
      "id": "ballposition",
      "layer": "geometry",
      "displayName": "Ball Position",
      "role": "Geometry input · Studio",
      "explanation": "Places the ball earlier or later along the club’s arc."
    },
    {
      "id": "archeight",
      "layer": "geometry",
      "displayName": "Arc Height",
      "role": "Geometry input · Studio",
      "explanation": "Moves the arc vertically and changes where the club meets the ball."
    },
    {
      "id": "attack",
      "layer": "delivery",
      "displayName": "Attack Angle",
      "role": "Studio-derived · Range input",
      "explanation": "The clubhead’s vertical direction at impact."
    },
    {
      "id": "path",
      "layer": "delivery",
      "displayName": "Club Path",
      "role": "Studio-derived · Range input",
      "explanation": "The clubhead’s horizontal direction through impact."
    },
    {
      "id": "face",
      "layer": "delivery",
      "displayName": "Club Face",
      "role": "Range input · Delivery",
      "explanation": "Where the face points when the ball leaves the club."
    },
    {
      "id": "loft",
      "layer": "delivery",
      "displayName": "Dynamic Loft",
      "role": "Range input · Delivery",
      "explanation": "The loft delivered by the face at impact."
    },
    {
      "id": "speed",
      "layer": "delivery",
      "displayName": "Club Speed",
      "role": "Range input · Energy",
      "explanation": "The clubhead’s available energy before impact."
    },
    {
      "id": "strike",
      "layer": "delivery",
      "displayName": "Strike",
      "role": "Derived in Studio · Contact",
      "explanation": "Where and how cleanly the club meets the ball."
    },
    {
      "id": "spinloft",
      "layer": "separation",
      "displayName": "Spin Loft (3-D)",
      "role": "Derived · Separation",
      "explanation": "The true included angle between club path and face normal. Includes face and path, not only loft and attack."
    },
    {
      "id": "verticalspinloft",
      "layer": "separation",
      "displayName": "Vertical Spin Loft",
      "role": "Derived · Separation",
      "explanation": "Dynamic loft minus attack angle. Blind to face and path — it is a different quantity from 3-D Spin Loft, not a simplification of it."
    },
    {
      "id": "spinaxis",
      "layer": "separation",
      "displayName": "Spin Axis",
      "role": "Derived · Separation",
      "explanation": "The tilt created by the face and path relationship."
    },
    {
      "id": "launchdir",
      "layer": "separation",
      "displayName": "Launch Direction",
      "role": "Derived · Separation",
      "explanation": "The ball’s starting direction immediately after impact."
    },
    {
      "id": "launchangle",
      "layer": "separation",
      "displayName": "Launch Angle",
      "role": "Derived · Separation",
      "explanation": "The ball’s starting height direction after impact."
    },
    {
      "id": "ballspeed",
      "layer": "separation",
      "displayName": "Ball Speed",
      "role": "Derived · Separation",
      "explanation": "The speed transferred to the ball at separation."
    },
    {
      "id": "backspin",
      "layer": "flight",
      "displayName": "Backspin",
      "role": "Modeled · Flight",
      "explanation": "The spin that shapes lift, height and descent."
    },
    {
      "id": "curve",
      "layer": "flight",
      "displayName": "Curve",
      "role": "Modeled · Flight",
      "explanation": "Sideways movement created during the airborne flight."
    },
    {
      "id": "apex",
      "layer": "flight",
      "displayName": "Apex",
      "role": "Modeled · Flight",
      "explanation": "The highest point reached by the modeled flight."
    },
    {
      "id": "carry",
      "layer": "flight",
      "displayName": "Carry",
      "role": "Modeled · Flight",
      "explanation": "The airborne distance to the modeled landing point."
    },
    {
      "id": "landingangle",
      "layer": "landing",
      "displayName": "Landing Angle",
      "role": "Modeled · Landing",
      "explanation": "In this model, vertical Spin Loft is the primary descent input; treat that as modeled context."
    },
    {
      "id": "side",
      "layer": "landing",
      "displayName": "Carry Side",
      "role": "Modeled · Landing",
      "explanation": "Where the ball finishes sideways at the carry point."
    },
    {
      "id": "total",
      "layer": "landing",
      "displayName": "Total",
      "role": "Modeled · Landing",
      "explanation": "The modeled finish after carry and ground response."
    }
  ],
  "edges": [
    {
      "id": "e0",
      "from": "ballposition",
      "to": "lowpoint",
      "type": "direct",
      "strength": "primary"
    },
    {
      "id": "e1",
      "from": "lowpoint",
      "to": "attack",
      "type": "direct",
      "strength": "primary"
    },
    {
      "id": "e2",
      "from": "direction",
      "to": "attack",
      "type": "direct",
      "strength": "contributing"
    },
    {
      "id": "e3",
      "from": "plane",
      "to": "attack",
      "type": "direct",
      "strength": "contextual"
    },
    {
      "id": "e4",
      "from": "path",
      "to": "attack",
      "type": "coupled",
      "strength": "variable"
    },
    {
      "id": "e5",
      "from": "direction",
      "to": "path",
      "type": "direct",
      "strength": "primary"
    },
    {
      "id": "e6",
      "from": "lowpoint",
      "to": "path",
      "type": "direct",
      "strength": "contributing"
    },
    {
      "id": "e7",
      "from": "plane",
      "to": "path",
      "type": "direct",
      "strength": "contextual"
    },
    {
      "id": "e8",
      "from": "lowpoint",
      "to": "strike",
      "type": "direct",
      "strength": "primary"
    },
    {
      "id": "e9",
      "from": "archeight",
      "to": "strike",
      "type": "direct",
      "strength": "contributing"
    },
    {
      "id": "e10",
      "from": "attack",
      "to": "spinloft",
      "type": "direct",
      "strength": "primary"
    },
    {
      "id": "e11",
      "from": "loft",
      "to": "spinloft",
      "type": "direct",
      "strength": "primary"
    },
    {
      "id": "e12",
      "from": "face",
      "to": "spinaxis",
      "type": "direct",
      "strength": "primary"
    },
    {
      "id": "e13",
      "from": "path",
      "to": "spinaxis",
      "type": "direct",
      "strength": "primary"
    },
    {
      "id": "e14",
      "from": "attack",
      "to": "spinaxis",
      "type": "direct",
      "strength": "contextual"
    },
    {
      "id": "e15",
      "from": "loft",
      "to": "spinaxis",
      "type": "direct",
      "strength": "contextual"
    },
    {
      "id": "e16",
      "from": "face",
      "to": "launchdir",
      "type": "direct",
      "strength": "primary"
    },
    {
      "id": "e17",
      "from": "path",
      "to": "launchdir",
      "type": "direct",
      "strength": "contributing"
    },
    {
      "id": "e18",
      "from": "loft",
      "to": "launchdir",
      "type": "direct",
      "strength": "contextual"
    },
    {
      "id": "e19",
      "from": "attack",
      "to": "launchangle",
      "type": "direct",
      "strength": "contributing"
    },
    {
      "id": "e20",
      "from": "loft",
      "to": "launchangle",
      "type": "direct",
      "strength": "primary"
    },
    {
      "id": "e21",
      "from": "speed",
      "to": "ballspeed",
      "type": "direct",
      "strength": "primary"
    },
    {
      "id": "e22",
      "from": "spinloft",
      "to": "ballspeed",
      "type": "direct",
      "strength": "contributing"
    },
    {
      "id": "e23",
      "from": "spinloft",
      "to": "backspin",
      "type": "direct",
      "strength": "primary"
    },
    {
      "id": "e24",
      "from": "speed",
      "to": "backspin",
      "type": "direct",
      "strength": "contributing"
    },
    {
      "id": "e25",
      "from": "spinaxis",
      "to": "curve",
      "type": "modeled",
      "strength": "primary"
    },
    {
      "id": "e26",
      "from": "launchangle",
      "to": "apex",
      "type": "modeled",
      "strength": "primary"
    },
    {
      "id": "e27",
      "from": "ballspeed",
      "to": "apex",
      "type": "modeled",
      "strength": "contributing"
    },
    {
      "id": "e28",
      "from": "launchangle",
      "to": "carry",
      "type": "modeled",
      "strength": "contextual",
      "condition": "low-launch-only"
    },
    {
      "id": "e29",
      "from": "ballspeed",
      "to": "carry",
      "type": "modeled",
      "strength": "primary"
    },
    {
      "id": "e30",
      "from": "verticalspinloft",
      "to": "landingangle",
      "type": "modeled",
      "strength": "primary"
    },
    {
      "id": "e31",
      "from": "launchdir",
      "to": "side",
      "type": "modeled",
      "strength": "primary"
    },
    {
      "id": "e32",
      "from": "curve",
      "to": "side",
      "type": "modeled",
      "strength": "contributing"
    },
    {
      "id": "e33",
      "from": "carry",
      "to": "side",
      "type": "modeled",
      "strength": "contextual"
    },
    {
      "id": "e34",
      "from": "carry",
      "to": "total",
      "type": "modeled",
      "strength": "primary"
    },
    {
      "id": "e35",
      "from": "landingangle",
      "to": "total",
      "type": "modeled",
      "strength": "contributing"
    },
    {
      "id": "e36",
      "from": "loft",
      "to": "verticalspinloft",
      "type": "direct",
      "strength": "primary"
    },
    {
      "id": "e37",
      "from": "attack",
      "to": "verticalspinloft",
      "type": "direct",
      "strength": "primary"
    }
  ],
  "explanations": {
    "nodes": {
      "attack": {
        "causes": [
          "Primary: Low Point places impact on the arc.",
          "Supports: Swing Direction shapes vertical delivery.",
          "Varies: Plane is contextual; Path stays coupled."
        ],
        "effects": [
          "Primary: it changes the gap to delivered loft.",
          "Supports: it helps shape Launch Angle.",
          "Varies: Spin Axis depends on the wider delivery."
        ]
      }
    }
  },
  "_knownDebt": [],
  "_changeLog": [
    {
      "date": "2026-08-25",
      "ref": "e30, F8, D36",
      "change": "spinloft splittet i spinloft (3-D) og verticalspinloft. e30 pekte paa 3-D-noden, men landingsmodellen leser abs(signedVerticalSpinLoftDeg). Verifisert 4315/4315: smash bruker 3-D, spinnkalibreringen bruker vertikal. To stoerrelser, ikke en forenkling av den andre.",
      "edgesAdded": [
        "e36",
        "e37"
      ],
      "nodesAdded": [
        "verticalspinloft"
      ],
      "note": "Grafen beskriver modellen ETTER D36. I dag mater verticalspinloft fortsatt spinnkalibreringen via e23-stien; etter D36 gjoer den ikke det. Avviket er bevisst og skal lukkes av implementasjonen, ikke av grafen."
    }
  ]
};
