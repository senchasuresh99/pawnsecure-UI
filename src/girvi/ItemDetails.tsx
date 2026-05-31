import { useNavigate } from "react-router-dom";
import { useGirvi } from "./GirviContext";
import { useState } from "react";
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaArrowRight,
} from "react-icons/fa";
import DealerBottomNav from "../dealer/DealerBottomNav";

export default function ItemDetails() {
  const nav = useNavigate();
  const { items, setItems } = useGirvi();

  const [item, setItem] = useState({
    name: "",
    weight: "",
    purity: "",
    desc: "",
  });

  function addItem() {
    if (!item.name || !item.weight) return;

    setItems([...items, item]);
    setItem({ name: "", weight: "", purity: "", desc: "" });
  }

  function remove(index: number) {
    setItems(items.filter((_: any, i: number) => i !== index));
  }

  const totalWeight = items.reduce(
    (sum: number, i: any) => sum + Number(i.weight || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-32">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-purple-800 to-indigo-600 text-white rounded-b-[32px] px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={() => nav(-1)}>
            <FaArrowLeft className="text-xl" />
          </button>

          <div className="text-center">
            <h1 className="font-bold text-lg">New Girvi</h1>
            <p className="text-xs opacity-80">PawnSecure</p>
          </div>

          <div className="w-6" />
        </div>

        <h2 className="text-2xl font-bold">Item Details</h2>
        <p className="text-sm opacity-80 mt-1">
          Add pledged items and weight
        </p>
      </div>

      {/* CARD */}
      <div className="max-w-md mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
          {/* STEP INDICATOR */}
          <div className="flex justify-between items-center text-xs font-semibold mb-6">
            <span className="text-green-600">Customer</span>
            <div className="flex-1 h-[2px] bg-green-600 mx-2" />

            <span className="text-green-600">Girvi</span>
            <div className="flex-1 h-[2px] bg-green-600 mx-2" />

            <span className="text-purple-600">Items</span>
            <div className="flex-1 h-[2px] bg-purple-600 mx-2" />

            <span className="text-gray-400">Review</span>
          </div>

          {/* ADD ITEM */}
          <div className="space-y-4 mb-6">
            <Input
              label="Item Name *"
              value={item.name}
              placeholder="Gold Chain, Ring..."
              onChange={(v: string) => setItem({ ...item, name: v })}
            />

            <Input
              label="Weight (gm) *"
              value={item.weight}
              placeholder="Enter weight in grams"
              onChange={(v: string) =>
                setItem({ ...item, weight: v.replace(/[^\d.]/g, "") })
              }
            />

            <Input
              label="Purity"
              value={item.purity}
              placeholder="22K, 18K"
              onChange={(v: string) => setItem({ ...item, purity: v })}
            />

            <Input
              label="Description"
              value={item.desc}
              placeholder="Optional description"
              onChange={(v: string) => setItem({ ...item, desc: v })}
            />

            <button
              type="button"
              onClick={addItem}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <FaPlus />
              Add Item
            </button>
          </div>

          {/* ITEMS LIST */}
          {items.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-bold text-gray-700">
                Added Items
              </h3>

              {items.map((it: any, i: number) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-2xl p-4 flex justify-between items-start"
                >
                  <div>
                    <p className="font-bold text-gray-800">{it.name}</p>

                    <p className="text-xs text-gray-500 mt-1">
                      {it.weight} gm
                      {it.purity ? ` • ${it.purity}` : ""}
                    </p>

                    {it.desc && (
                      <p className="text-xs text-gray-400 mt-1">
                        {it.desc}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-red-600 text-sm font-semibold"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* SUMMARY */}
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-sm mb-6">
            <p>
              <span className="font-semibold">Total Items:</span>{" "}
              {items.length}
            </p>

            <p className="mt-1">
              <span className="font-semibold">Total Weight:</span>{" "}
              {totalWeight} gm
            </p>
          </div>

          {/* NEXT */}
          <button
            type="button"
            onClick={() => nav("/dealer/review")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            Next: Review
            <FaArrowRight />
          </button>
        </div>
      </div>

      {/* ✅ BOTTOM NAV */}
      <DealerBottomNav />
    </div>
  );
}

/* ---------------- INPUT ---------------- */

function Input({
  label,
  value,
  onChange,
  placeholder,
}: any) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-semibold">{label}</label>

      <input
        value={value}
        placeholder={placeholder || label}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border rounded-2xl px-4 py-3 text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-purple-500"
      />
    </div>
  );
}