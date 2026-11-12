import { COLORS, START_SQUARE, isSafeSquare } from "@arcadia/game-core";
import type { Color, GameState } from "@arcadia/game-core";
import { HOME_COLUMN, TRACK, YARD_ORIGIN, YARD_SLOTS, layoutTokens } from "./layout";
import type { TokenView } from "./layout";

const FILL: Record<Color, string> = {
  red: "#e53935",
  green: "#43a047",
  yellow: "#fdd835",
  blue: "#1e88e5",
};

interface BoardProps {
  game: GameState;
  legal: number[]; // token indexes the current player may move
  onTokenClick: (tokenIndex: number) => void;
}

export default function Board({ game, legal, onTokenClick }: BoardProps) {
  const currentColor = game.players[game.turn].color;
  const canClick = (t: TokenView) => t.color === currentColor && legal.includes(t.index);

  // Draw clickable tokens last so they sit on top of any stack.
  const tokens = layoutTokens(game);

  return (
    <svg viewBox="0 0 15 15" width="100%" style={{ display: "block", maxWidth: 560, margin: "0 auto" }}>
      <rect width="15" height="15" fill="#fff" />

      {COLORS.map((color) => {
        const [ox, oy] = YARD_ORIGIN[color];
        return (
          <g key={color}>
            <rect x={ox} y={oy} width="6" height="6" fill={FILL[color]} />
            <rect x={ox + 1} y={oy + 1} width="4" height="4" rx="0.4" fill="#fff" />
            {YARD_SLOTS.map(([sx, sy], i) => (
              <circle key={i} cx={ox + sx} cy={oy + sy} r="0.45" fill={FILL[color]} opacity="0.25" />
            ))}
          </g>
        );
      })}

      {TRACK.map(([col, row], square) => {
        const owner = COLORS.find((c) => START_SQUARE[c] === square);
        return (
          <g key={square}>
            <rect
              x={col} y={row} width="1" height="1"
              fill={owner ? FILL[owner] : "#fff"} stroke="#888" strokeWidth="0.04"
            />
            {isSafeSquare(square) && (
              <text
                x={col + 0.5} y={row + 0.5} fontSize="0.7" textAnchor="middle"
                dominantBaseline="central" fill="#000" fillOpacity="0.45" pointerEvents="none"
              >
                ★
              </text>
            )}
          </g>
        );
      })}

      {COLORS.flatMap((color) =>
        HOME_COLUMN[color].map(([col, row], i) => (
          <rect
            key={`${color}-${i}`} x={col} y={row} width="1" height="1"
            fill={FILL[color]} stroke="#888" strokeWidth="0.04"
          />
        ))
      )}

      <polygon points="6,6 6,9 7.5,7.5" fill={FILL.red} />
      <polygon points="6,6 9,6 7.5,7.5" fill={FILL.green} />
      <polygon points="9,6 9,9 7.5,7.5" fill={FILL.yellow} />
      <polygon points="6,9 9,9 7.5,7.5" fill={FILL.blue} />

    {/* Visual layer: stable order, glides between positions. */}
    {tokens.map((t) => (
        <g
          key={`${t.color}-${t.index}`}
          style={{ transform: `translate(${t.x}px, ${t.y}px)`, transition: "transform 140ms linear" }}
        >
          <circle r="0.32" fill={FILL[t.color]} stroke="#222" strokeWidth="0.05" />
        </g>
      ))}

      {/* Interaction layer: rings on top, so a click never lands on a token stacked above. */}
      {tokens.filter(canClick).map((t) => (
        <circle
          key={`hit-${t.color}-${t.index}`}
          cx={t.x}
          cy={t.y}
          r="0.46"
          fill="transparent"
          stroke="#ff9800"
          strokeWidth="0.08"
          style={{ cursor: "pointer" }}
          onClick={() => onTokenClick(t.index)}
        />
      ))}
    </svg>
  );
}