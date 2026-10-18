// Verified against the loaded web game and Boss practice roster, 18 October 2026.
export default {
  "product": "Morogue",
  "platform": "web",
  "verifiedAt": "2026-10-18T04:38:19.093Z",
  "status": "verified name roster; not a complete strategy guide",
  "spoilerLevel": "boss identities including final adversary; warn before listing",
  "entry": {
    "url": "https://morogue.repocompany.uk/",
    "sha256": "41882753a4a344b706fded917ee960db2813e34c8a920791ec74e688f14b618c"
  },
  "sources": [
    {
      "filename": "boss-patterns.js",
      "url": "https://morogue.repocompany.uk/interface/vampire-survivor/boss-patterns.js",
      "sha256": "e2fceb6340343d26706a1a44925134938036f5bd3df486640c753b8d0bb17871",
      "entryReferenced": true
    },
    {
      "filename": "major-bosses.js",
      "url": "https://repocompany.uk/game-integrations/morogue/major-bosses.js?v=579482982984",
      "sha256": "6ff64f777df5b697457ae25f4c80ac16dbbc496cc9189135782ab39f36151d8e",
      "entryReferenced": true
    },
    {
      "filename": "finale.js",
      "url": "https://morogue.repocompany.uk/interface/vampire-survivor/finale.js",
      "sha256": "bc5367a3321e03bae181a8c78d717ee6c470b880188a2d06b1235e61e8e3f703",
      "entryReferenced": true
    },
    {
      "filename": "game.js",
      "url": "https://repocompany.uk/game-integrations/morogue/relics-20261015/game.js?v=c3cd74169ab2",
      "sha256": "c3cd74169ab2ab332e9a8ea8d56dc6f1be6c3e467bfb8e48fed2bb3a123d956f",
      "entryReferenced": true
    },
    {
      "filename": "app.js",
      "url": "https://repocompany.uk/game-integrations/morogue/relics-20261015/app.js?v=1a45416cf347",
      "sha256": "1a45416cf34726bce21ce2c374df71e4b913c491aee7f699024a1802eb2c57e1",
      "entryReferenced": true
    }
  ],
  "greatAdversaries": [
    {
      "id": "kiln",
      "name": "The Kiln Sovereign",
      "arena": "The Furnace Court",
      "source": "major-bosses.js"
    },
    {
      "id": "admiral",
      "name": "The Drowned Admiral",
      "arena": "The Undertow Dock",
      "source": "major-bosses.js"
    },
    {
      "id": "briar",
      "name": "The Briar Matriarch",
      "arena": "The Root Cathedral",
      "source": "major-bosses.js"
    },
    {
      "id": "prism",
      "name": "The Prism Curator",
      "arena": "The Hall of Reflections",
      "source": "major-bosses.js"
    },
    {
      "id": "clock",
      "name": "The First Clock",
      "arena": "The Unwound Belfry",
      "source": "major-bosses.js"
    },
    {
      "id": "star",
      "name": "The Hollow Star",
      "arena": "The Starless Observatory",
      "source": "major-bosses.js"
    },
    {
      "id": "cantor",
      "name": "The Storm Cantor",
      "arena": "The Bellstorm Belfry",
      "source": "boss-patterns.js"
    },
    {
      "id": "duelist",
      "name": "The Gilded Duelist",
      "arena": "The Gilded Conservatory",
      "source": "boss-patterns.js"
    },
    {
      "id": "beekeeper",
      "name": "The Pale Beekeeper",
      "arena": "The Pale Apiary",
      "source": "boss-patterns.js"
    },
    {
      "id": "magistrate",
      "name": "The Ink Magistrate",
      "arena": "The Inkwell Tribunal",
      "source": "boss-patterns.js"
    },
    {
      "id": "railmaster",
      "name": "The Ashen Railmaster",
      "arena": "The Cinder Terminus",
      "source": "boss-patterns.js"
    },
    {
      "id": "oracle",
      "name": "The Salt Oracle",
      "arena": "The Saltglass Sanctuary",
      "source": "boss-patterns.js"
    }
  ],
  "demibosses": [
    {
      "id": "landlord",
      "name": "The Last Landlord",
      "source": "game.js"
    },
    {
      "id": "bellkeeper",
      "name": "The Bellkeeper",
      "source": "game.js"
    },
    {
      "id": "duchess",
      "name": "The Velvet Duchess",
      "source": "game.js"
    },
    {
      "id": "ferryman",
      "name": "The Pale Ferryman",
      "source": "game.js"
    },
    {
      "id": "baker",
      "name": "The Crustmaker",
      "source": "game.js"
    },
    {
      "id": "groundskeeper",
      "name": "The Thorn Warden",
      "source": "game.js"
    },
    {
      "id": "clockmaker",
      "name": "The Hourless Clockmaker",
      "source": "game.js"
    },
    {
      "id": "mirrorlord",
      "name": "The Glass Regent",
      "source": "game.js"
    },
    {
      "id": "huntsman",
      "name": "The Pale Huntsman",
      "source": "game.js"
    },
    {
      "id": "nightmayor",
      "name": "The Mayor of Midnight",
      "source": "game.js"
    }
  ],
  "finalAdversary": {
    "id": "uncrowned",
    "name": "The Uncrowned",
    "arena": "The Throne Above the Night",
    "source": "finale.js"
  },
  "visibilityEvidence": "The published app.js bossGuide uses Engine.MAJOR_BOSSES, Engine.BOSSES and Engine.FINAL_BOSS to build the player-facing Boss practice roster.",
  "exclusions": "Roguemora is not a published title. Do not turn a mistyped title into fictional content. No names inferred from asset filenames."
};
