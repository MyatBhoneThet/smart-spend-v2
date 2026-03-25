// src/components/Inputs/Input.jsx
import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const Input = ({ label, type = "text", value, onChange, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="mb-3">
      {label && <label className="block text-sm font-semibold mb-1">{label}</label>}

      <div className="flex items-center border rounded px-2">
        <input
          type={type === "password" ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full p-2 bg-transparent outline-none"
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
  <div className="mb-3">
    {label && <label className="block text-sm font-semibold mb-1">{label}</label>}
    <textarea className="w-full border rounded p-2" {...props} />
  </div>
);

export default Input;
