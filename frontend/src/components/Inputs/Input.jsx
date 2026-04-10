// src/components/Inputs/Input.jsx
import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const Input = ({ label, type = "text", value, onChange, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="mb-4">
      {label && <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">{label}</label>}

      <div className="flex items-center rounded-2xl border border-white/18 bg-white/14 px-3 py-2.5 shadow-[0_14px_36px_rgba(15,23,42,0.08)] backdrop-blur-3xl backdrop-saturate-150 ring-1 ring-white/30 dark:border-white/10 dark:bg-white/[0.05]">
        <input
          type={type === "password" ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent px-1 py-1.5 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
        />

        {type === "password" && (
          <>
            {showPassword ? (
              <FaRegEye
                size={20}
                className="text-primary cursor-pointer"
                onClick={toggleShowPassword}
              />
            ) : (
              <FaRegEyeSlash
                size={20}
                className="text-slate-500 cursor-pointer"
                onClick={toggleShowPassword}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Optional: If you need TextArea, you can still export it
export const TextArea = ({ label, ...props }) => (
  <div className="mb-4">
    {label && <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">{label}</label>}
    <textarea className="w-full rounded-2xl border border-white/18 bg-white/14 px-4 py-3 shadow-[0_14px_36px_rgba(15,23,42,0.08)] backdrop-blur-3xl backdrop-saturate-150 outline-none ring-1 ring-white/30 dark:border-white/10 dark:bg-white/[0.05] dark:text-white" {...props} />
  </div>
);

export default Input;
