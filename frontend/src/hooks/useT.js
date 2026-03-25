import { useContext, useMemo } from "react";
import { UserContext } from "../context/UserContext";
import en from "../locales/en";
import th from "../locales/th";
import my from "../locales/my";

const DICTS = { en, th, my };

function getDeep(obj, path) {
  return path.split(".").reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), obj);
}

export default function useT() {
  const { prefs } = useContext(UserContext) || {};
  const lang = (prefs && prefs.language) || "en";

  const t = useMemo(() => {
    return (key, vars) => {
      const dict = DICTS[lang] || DICTS.en;
      let str = getDeep(dict, key) ?? getDeep(DICTS.en, key) ?? key;
      if (vars && typeof str === "string") {
        str = str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));
      }
      return str;
    };
  }, [lang]);

  return { t, lang };
}
