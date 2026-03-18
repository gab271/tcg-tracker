/**
 * Registry de providers TCG.
 * Punto único para obtener el provider correcto según el juego.
 * Las instancias se crean lazy (sin singleton — stateless providers).
 */

import type { TCGProvider, GameKey } from "@/lib/tcg/types";

export function getProvider(game: GameKey): TCGProvider {
  switch (game) {
    case "pokemon": {
      const { PokemonProvider } = require("./providers/pokemon-provider");
      return new PokemonProvider() as TCGProvider;
    }
    case "magic": {
      const { MagicProvider } = require("./providers/magic-provider");
      return new MagicProvider() as TCGProvider;
    }
    case "yugioh": {
      const { YugiohProvider } = require("./providers/yugioh-provider");
      return new YugiohProvider() as TCGProvider;
    }
    case "onepiece": {
      const { OnePieceProvider } = require("./providers/onepiece-provider");
      return new OnePieceProvider() as TCGProvider;
    }
  }
}
