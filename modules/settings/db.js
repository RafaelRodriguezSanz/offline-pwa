/**
 * modules/settings/db.js
 */
import { getMeta, setMeta } from "../../db.js";

export async function getSetting(key, defaultValue) {
  const val = await getMeta(key);
  return val !== undefined ? val : defaultValue;
}

export async function saveSetting(key, value) {
  return setMeta(key, value);
}
