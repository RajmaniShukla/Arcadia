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
      className={`grid size-20 shrink-0 touch-manipulation grid-cols-3 grid-rows-3 rounded-2xl border-2 border-slate-800 bg-white p-2 transition-transform duration-75 ${
        disabled && !rolling ? "opacity-50" : "cursor-pointer hover:bg-slate-50"
      } ${rolling ? "rotate-6 scale-105" : ""}`}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className={`size-3 place-self-center rounded-full ${
            PIPS[value].includes(i) ? "bg-slate-800" : "bg-transparent"
          }`}
        />
      ))}
    </button>
  );
}