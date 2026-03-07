export default function AnswerButtons({ onSelect }) {
  return (
    <div style={{ marginTop: 10 }}>
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button
          key={n}
          style={{ padding: "8px 12px", margin: "5px", fontSize: "18px" }}
          onClick={() => onSelect(String(n))}
        >
          {n}
        </button>
      ))}
    </div>
  );
}