/* Shared by the page and the service worker. Model names are GLB filenames. */
(function (scope) {
  "use strict";
  var models = {
    common: ["may_rigged", "chest"],
    hub: ["companion_milo", "npc_tortoise_elder", "hero_lighthouse", "cc0_boat", "cc0_cabin", "cc0_crab", "polyfork_rabbit", "polyfork_sheep"],
    level1: ["cc0_boat", "cc0_shipwreck", "cc0_crab", "cc0_dolphin", "cc0_whale", "cc0_clownfish", "polyfork_octopus", "fish", "tang-blue", "tang-yellow", "coral", "turtle", "jelly", "manta", "barrel", "amphora", "clam", "sanddollar", "starfish", "seaweed", "kelp"],
    level2: ["companion_milo", "boss_mushroom_king", "cc0_fox", "polyfork_deer", "polyfork_rabbit", "polyfork_bear", "fish", "tang-blue", "tang-yellow"],
    level3: ["polyfork_camel", "cc0_fox", "npc_tortoise_elder", "amphora", "fish", "tang-blue", "tang-yellow"],
    level4: ["boss_crystal_golem", "npc_tortoise_elder", "polyfork_owl", "fish", "tang-blue", "tang-yellow"],
    level5: ["cc0_reindeer", "cc0_fox", "polyfork_bear", "polyfork_hare", "polyfork_penguin", "polyfork_wolf"],
    level6: ["companion_milo", "cc0_unicorn", "polyfork_sheep", "boss_storm_king", "hero_castle", "cc0_windmill", "jelly"]
  };
  function modelURL(name) { return "assets/models/" + name + ".glb"; }
  var guides = {
    level1: ["ocean_greeting", "ocean_boss", "ocean_trap", "ocean_wave", "ocean_jelly", "ocean_pearl"],
    level4: ["cave_greeting", "cave_boss", "cave_dark", "cave_torch", "cave_spell", "cave_listen", "cave_rock", "cave_core"]
  };
  scope.MayPackages = { models: models, modelURL: modelURL, guides: guides };
})(self);
