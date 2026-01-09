/**
 * Translation Index
 * Combines all language translations
 */

import type { AllTranslations } from '../types'
import { en } from './en'
import { zh } from './zh'
import { ja } from './ja'
import { ko } from './ko'
import { fr } from './fr'
import { de } from './de'
import { es } from './es'

export const translations: AllTranslations = {
  en,
  zh,
  ja,
  ko,
  fr,
  de,
  es,
}

export { en, zh, ja, ko, fr, de, es }
