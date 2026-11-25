/* Shared by the page and the service worker. Model names are GLB filenames. */
(function (scope) {
  "use strict";
  var models = {
    common: ["may_rigged", "chest"],
    hub: ["companion_milo", "npc_tortoise_elder", "hero_lighthouse", "cc0_boat", "cc0_cabin", "cc0_crab", "cc0_alpaca"],
    level1: ["cc0_boat", "cc0_shipwreck", "cc0_crab", "cc0_dolphin", "cc0_whale", "cc0_clownfish", "fish", "tang-blue", "tang-yellow", "coral", "turtle", "jelly", "manta", "barrel", "amphora", "clam", "sanddollar", "starfish", "seaweed", "kelp"],
    level2: ["companion_milo", "boss_mushroom_king", "cc0_fox", "cc0_deer", "fish", "tang-blue", "tang-yellow"],
    level3: ["cc0_alpaca", "cc0_fox", "npc_tortoise_elder", "amphora", "fish", "tang-blue", "tang-yellow"],
    level4: ["boss_crystal_golem", "npc_tortoise_elder", "fish", "tang-blue", "tang-yellow"],
    level5: ["cc0_reindeer", "cc0_fox"],
    level6: ["companion_milo", "cc0_unicorn", "cc0_alpaca", "boss_storm_king", "hero_castle", "cc0_windmill", "jelly"]
  };
  function modelURL(name) { return "assets/models/" + name + ".glb"; }
  scope.MayPackages = { models: models, modelURL: modelURL };
})(self);
