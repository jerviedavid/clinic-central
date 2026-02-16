import { useState, useRef } from 'react'
import { ChevronDown, ChevronUp, Upload, Camera, X, Image as ImageIcon, File } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSpecialtyConfig, matchSpecialties, getAllSpecialties } from '../config/specialtyFields'
import { takePhoto, pickImage, hasNativeCamera } from '../utils/camera'

// Tailwind color map for dynamic specialty theming
const COLOR_MAP = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', headerBg: 'bg-cyan-500/5' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', headerBg: 'bg-pink-500/5' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', headerBg: 'bg-amber-500/5' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', headerBg: 'bg-blue-500/5' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', headerBg: 'bg-rose-500/5' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', headerBg: 'bg-orange-500/5' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', headerBg: 'bg-red-500/5' },
  fuchsia: { bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400', headerBg: 'bg-fuchsia-500/5' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', headerBg: 'bg-violet-500/5' },
  lime: { bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-400', headerBg: 'bg-lime-500/5' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', headerBg: 'bg-teal-500/5' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', headerBg: 'bg-yellow-500/5' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', headerBg: 'bg-emerald-500/5' },
  slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', headerBg: 'bg-slate-500/5' },
}

/**
 * Compute EDD from LMP date (Naegele's rule: +280 days)
 */
function computeEDD(lmpDate) {
  if (!lmpDate) return ''
  const lmp = new Date(lmpDate)
  if (isNaN(lmp.getTime())) return ''
  const edd = new Date(lmp)
  edd.setDate(edd.getDate() + 280)
  return edd.toISOString().split('T')[0]
}

/**
 * Renders a single dynamic field based on its type.
 */
function DynamicField({ field, value, onChange, colors }) {
  const fileInputRef = useRef(null)

  switch (field.type) {
    case 'text':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors text-white"
        />
      )

    case 'number':
      return (
        <input
          type="number"
          step={field.step || '1'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors text-white"
        />
      )

    case 'textarea':
      return (
        <textarea
          rows={field.rows || 3}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors text-white resize-none"
        />
      )

    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors text-white [&>option]:text-black"
        >
          {field.options.map((opt, i) => (
            <option key={i} value={opt}>{opt || `Select ${field.label}`}</option>
          ))}
        </select>
      )

    case 'date':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors text-white"
        />
      )

    case 'scale': {
      const scaleValue = parseInt(value) || field.min || 1
      return (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={field.min || 1}
            max={field.max || 10}
            value={scaleValue}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 accent-cyan-400"
          />
          <span className={`w-10 text-center text-lg font-bold ${
            scaleValue <= 3 ? 'text-green-400' :
            scaleValue <= 6 ? 'text-yellow-400' :
            'text-red-400'
          }`}>{scaleValue}</span>
        </div>
      )
    }

    case 'computed':
      // Auto-computed field (read-only)
      return (
        <input
          type="text"
          readOnly
          value={value || 'Auto-calculated'}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 outline-none cursor-not-allowed"
        />
      )

    case 'file': {
      const fileData = value // Can be a base64 string or null
      return (
        <div className="space-y-2">
          {fileData ? (
            <div className="relative group inline-block">
              {typeof fileData === 'string' && fileData.startsWith('data:image') ? (
                <img src={fileData} alt={field.label} className="max-h-32 rounded-lg border border-white/10 object-contain" />
              ) : (
                <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg">
                  <File className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-300">File uploaded</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : null}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                if (file.size > 10 * 1024 * 1024) {
                  toast.error('File should be less than 10MB')
                  return
                }
                const reader = new FileReader()
                reader.onloadend = () => onChange(reader.result)
                reader.readAsDataURL(file)
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-2 px-3 py-1.5 ${colors.bg} ${colors.text} rounded-lg transition-colors text-sm border ${colors.border}`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>
        </div>
      )
    }

    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors text-white"
        />
      )
  }
}

/**
 * Renders a single specialty section with collapsible UI.
 */
function SpecialtySection({ specialtyKey, config, data, onChange }) {
  const [expanded, setExpanded] = useState(true)
  const colors = COLOR_MAP[config.color] || COLOR_MAP.cyan

  // Handle computed fields (like EDD from LMP)
  const getFieldValue = (field) => {
    if (field.type === 'computed' && field.computeFn === 'edd') {
      const lmpValue = data?.[field.computeFrom]
      return computeEDD(lmpValue)
    }
    return data?.[field.key] || ''
  }

  const handleFieldChange = (fieldKey, value) => {
    onChange({
      ...data,
      [fieldKey]: value
    })
  }

  return (
    <div className={`border ${colors.border} rounded-2xl overflow-hidden`}>
      {/* Specialty Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-4 ${colors.headerBg} hover:bg-white/5 transition-colors`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{config.icon}</span>
          <h3 className={`text-sm font-bold ${colors.text} uppercase tracking-wider`}>
            {config.label} Fields
          </h3>
        </div>
        {expanded ? (
          <ChevronUp className={`w-4 h-4 ${colors.text}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${colors.text}`} />
        )}
      </button>

      {/* Collapsible Content */}
      {expanded && (
        <div className="p-4 space-y-6">
          {config.sections.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{section.title}</h4>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map((field) => {
                  // Full-width for textarea and file types
                  const isFullWidth = field.type === 'textarea' || field.type === 'file'
                  return (
                    <div key={field.key} className={isFullWidth ? 'md:col-span-2' : ''}>
                      <label className="block text-xs text-slate-400 mb-1">{field.label}</label>
                      <DynamicField
                        field={field}
                        value={getFieldValue(field)}
                        onChange={(val) => handleFieldChange(field.key, val)}
                        colors={colors}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Main SpecialtyFields component.
 * 
 * Props:
 * - specialization: string - the doctor's specialization (used for auto-matching)
 * - specialtyData: object - { [specialtyKey]: { fieldKey: value, ... }, ... }
 * - onChange: (newSpecialtyData) => void
 * - manualOverride: boolean - allow manual specialty selection
 */
export default function SpecialtyFields({ specialization, specialtyData = {}, onChange, manualOverride = true }) {
  const [manualSelections, setManualSelections] = useState([])
  const [showSelector, setShowSelector] = useState(false)

  // Auto-match specialties from specialization string
  const autoMatched = matchSpecialties(specialization)

  // Combine auto-matched + manually selected (deduplicated)
  const activeSpecialties = [...new Set([...autoMatched, ...manualSelections])]

  const allSpecialties = getAllSpecialties()
  const availableToAdd = allSpecialties.filter(s => !activeSpecialties.includes(s.key))

  const handleSpecialtyDataChange = (specialtyKey, newData) => {
    onChange({
      ...specialtyData,
      [specialtyKey]: newData
    })
  }

  const addManualSpecialty = (key) => {
    setManualSelections(prev => [...prev, key])
    setShowSelector(false)
  }

  const removeManualSpecialty = (key) => {
    setManualSelections(prev => prev.filter(k => k !== key))
    // Also clear that specialty's data
    const updated = { ...specialtyData }
    delete updated[key]
    onChange(updated)
  }

  if (activeSpecialties.length === 0 && !manualOverride) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
            Specialty-Specific Fields
          </h3>
          <div className="h-px flex-1 bg-indigo-400/20"></div>
        </div>

        {manualOverride && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSelector(!showSelector)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-colors text-sm border border-indigo-500/30"
            >
              <span>+ Add Specialty</span>
            </button>

            {showSelector && availableToAdd.length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-64 max-h-64 overflow-y-auto bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-20">
                {availableToAdd.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => addManualSpecialty(s.key)}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center gap-3 text-sm text-slate-300"
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {activeSpecialties.length === 0 ? (
        <div className="text-center py-8 bg-white/5 border border-dashed border-white/10 rounded-xl">
          <p className="text-sm text-slate-500">No specialty fields active.</p>
          <p className="text-xs text-slate-600 mt-1">
            {specialization
              ? 'Click "+ Add Specialty" to add specialty-specific fields manually.'
              : 'Set the doctor\'s specialization to auto-detect, or add manually.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSpecialties.map((key) => {
            const config = getSpecialtyConfig(key)
            if (!config) return null
            const isManual = manualSelections.includes(key) && !autoMatched.includes(key)

            return (
              <div key={key} className="relative">
                {isManual && (
                  <button
                    type="button"
                    onClick={() => removeManualSpecialty(key)}
                    className="absolute top-4 right-12 z-10 p-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md transition-colors"
                    title="Remove specialty"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <SpecialtySection
                  specialtyKey={key}
                  config={config}
                  data={specialtyData[key] || {}}
                  onChange={(newData) => handleSpecialtyDataChange(key, newData)}
                />
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
