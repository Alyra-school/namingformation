import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

const IDEAS_COUNT = 34
const COLUMN_COUNT = 4
const ROW_COUNT = 6
const topHeaderLabels = [
  'Formation Courte 1',
  'Formation Courte 2',
  'Formation longue 1',
  'Formation longue 2',
]

const leftHeaderLabels = [
  'Generaliste Blockchain',
  'Dev Blockchain',
  "Cas d'usage Blockchain (DeFi)",
  'Generaliste IA',
  'Dev IA',
  "Cas d'usage IA (Outils IA)",
]

function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title
  }, [title])
}

function FormPage() {
  useDocumentTitle('Naming Alyra')

  const [name, setName] = useState('')
  const [ideas, setIdeas] = useState(() => Array(IDEAS_COUNT).fill(''))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filledIdeasCount = useMemo(
    () => ideas.filter((idea) => idea.trim() !== '').length,
    [ideas],
  )

  const onIdeaChange = (index, value) => {
    setIdeas((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const cleanName = name.trim()
    const normalizedIdeas = ideas.map((idea) => idea.trim())
    const hasAtLeastOneIdea = normalizedIdeas.some((idea) => idea !== '')

    if (!cleanName) {
      setError('Le nom est obligatoire.')
      return
    }

    if (!hasAtLeastOneIdea) {
      setError('Ajoute au moins une idee avant d\'envoyer.')
      return
    }

    setIsSubmitting(true)
    const { error: insertError } = await supabase.from('opinions').insert({
      name: cleanName,
      ideas: normalizedIdeas,
    })
    setIsSubmitting(false)

    if (insertError) {
      setError('Erreur lors de l\'enregistrement. Verifie la configuration Supabase.')
      return
    }

    setSuccess('Avis enregistre.')
    setName('')
    setIdeas(Array(IDEAS_COUNT).fill(''))
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="title-group">
          <img src="/alyra-logo.png" alt="Logo Alyra" className="title-logo" />
          <h1>naming alyra</h1>
        </div>
      </header>

      <form onSubmit={onSubmit} className="form-card">
        <label htmlFor="name">Nom</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="..."
        />

        <div className="ideas-header">Idees ({filledIdeasCount}/{IDEAS_COUNT})</div>

        <section className="matrix-wrap" aria-label="Matrice d'idees">
          <div className="matrix-top">
            <div className="top-spacer" aria-hidden="true"></div>
            {topHeaderLabels.map((label, colIndex) => (
              <div key={label} className="head-block">
                <div className="head-label">{label}</div>
                <input
                  type="text"
                  className="pill-input"
                  value={ideas[colIndex]}
                  onChange={(e) => onIdeaChange(colIndex, e.target.value)}
                  placeholder="..."
                />
              </div>
            ))}
          </div>

          <div className="matrix-body">
            {Array.from({ length: ROW_COUNT }).map((_, rowIndex) => (
              <div key={rowIndex} className="matrix-row">
                <div className="side-block">
                  <div className="side-label">{leftHeaderLabels[rowIndex]}</div>
                  <input
                    type="text"
                    className="pill-input"
                    value={ideas[4 + rowIndex]}
                    onChange={(e) => onIdeaChange(4 + rowIndex, e.target.value)}
                    placeholder="..."
                  />
                </div>

                {Array.from({ length: COLUMN_COUNT }).map((__, colIndex) => {
                  const index = 10 + rowIndex * COLUMN_COUNT + colIndex
                  return (
                    <div key={`${rowIndex}-${colIndex}`} className="cell-block">
                      <input
                        type="text"
                        className="pill-input"
                        value={ideas[index]}
                        onChange={(e) => onIdeaChange(index, e.target.value)}
                        placeholder="..."
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </section>

        {error ? <p className="message error">{error}</p> : null}
        {success ? <p className="message success">{success}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'envoi...' : 'envoyer'}
        </button>
      </form>
    </main>
  )
}

function ResultsPage() {
  useDocumentTitle('Resultats Naming Alyra')

  const [opinions, setOpinions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadOpinions(showLoader = false) {
      if (showLoader && isMounted) {
        setLoading(true)
      }

      const { data, error: selectError } = await supabase
        .from('opinions')
        .select('id, name, ideas, created_at')
        .order('created_at', { ascending: false })

      if (!isMounted) {
        return
      }

      if (selectError) {
        setError('Impossible de charger les resultats.')
        setLoading(false)
        return
      }

      setError('')
      setOpinions(data ?? [])
      setLoading(false)
    }

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        loadOpinions()
      }
    }

    loadOpinions(true)

    const intervalId = window.setInterval(refreshIfVisible, 10000)
    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [])

  const fieldOpinions = useMemo(() => {
    const grouped = Array.from({ length: IDEAS_COUNT }, () => [])
    opinions.forEach((opinion) => {
      ;(opinion.ideas || []).forEach((text, index) => {
        if (text && text.trim() !== '') {
          grouped[index].push({ name: opinion.name, text: text.trim() })
        }
      })
    })
    return grouped
  }, [opinions])

  return (
    <main className="page">
      <header className="topbar">
        <div className="title-group">
          <img src="/alyra-logo.png" alt="Logo Alyra" className="title-logo" />
          <h1>Resultats naming alyra</h1>
        </div>
        <Link to="/">Retour au formulaire</Link>
      </header>

      <section className="results">
        {loading ? <p>Chargement...</p> : null}
        {error ? <p className="message error">{error}</p> : null}
        {!loading && !error && opinions.length === 0 ? <p>Aucun avis pour le moment.</p> : null}

        {!loading && !error && opinions.length > 0 ? (
          <section className="matrix-wrap" aria-label="Matrice des resultats">
            <div className="matrix-top">
              <div className="top-spacer" aria-hidden="true"></div>
              {topHeaderLabels.map((label, colIndex) => (
                <div key={label} className="head-block results-block">
                  <div className="head-label">{label}</div>
                  <div className="opinion-list">
                    {fieldOpinions[colIndex].length === 0 ? (
                      <p className="empty-opinion">Aucun avis</p>
                    ) : (
                      fieldOpinions[colIndex].map((item, idx) => (
                        <p key={`${colIndex}-${idx}`} className="opinion-pill">
                          <strong>{item.name}:</strong> {item.text}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="matrix-body">
              {Array.from({ length: ROW_COUNT }).map((_, rowIndex) => (
                <div key={rowIndex} className="matrix-row">
                  <div className="side-block results-block">
                    <div className="side-label">{leftHeaderLabels[rowIndex]}</div>
                    <div className="opinion-list">
                      {fieldOpinions[4 + rowIndex].length === 0 ? (
                        <p className="empty-opinion">Aucun avis</p>
                      ) : (
                        fieldOpinions[4 + rowIndex].map((item, idx) => (
                          <p key={`${rowIndex}-${idx}`} className="opinion-pill">
                            <strong>{item.name}:</strong> {item.text}
                          </p>
                        ))
                      )}
                    </div>
                  </div>

                  {Array.from({ length: COLUMN_COUNT }).map((__, colIndex) => {
                    const index = 10 + rowIndex * COLUMN_COUNT + colIndex
                    return (
                      <div key={`${rowIndex}-${colIndex}`} className="cell-block results-cell">
                        <div className="opinion-list">
                          {fieldOpinions[index].length === 0 ? (
                            <p className="empty-opinion">Aucun avis</p>
                          ) : (
                            fieldOpinions[index].map((item, idx) => (
                              <p key={`${index}-${idx}`} className="opinion-pill">
                                <strong>{item.name}:</strong> {item.text}
                              </p>
                            ))
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FormPage />} />
        <Route path="/resultats" element={<ResultsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
