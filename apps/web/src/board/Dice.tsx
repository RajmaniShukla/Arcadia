// Which of the 9 grid cells (row by row) get a pip for each face.
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

interface DiceProps {
  value: number;
  rolling: boolean;
  disabled: boolean;
  onRoll: () => void;
}

export default function Dice({ value, rolling, disabled, onRoll }: DiceProps) {
  return (
    <button
      onClick={onRoll}
      disabled={disabled}
      aria-label={`Dice showing ${value}. Press to roll.`}
      style={{
        width: 72,
        height: 72,
        padding: 8,
        borderRadius: 14,
        border: "2px solid #333",
        background: "#fff",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(3, 1fr)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled && !rolling ? 0.55 : 1,
        transform: rolling ? "rotate(8deg) scale(1.06)" : "none",
        transition: "transform 80ms",
      }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          style={{
            placeSelf: "center",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: PIPS[value].includes(i) ? "#222" : "transparent",
          }}
        />
      ))}
    </button>
  );
}