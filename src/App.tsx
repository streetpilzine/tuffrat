import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Layout } from './ui/Layout'
import { Home } from './pages/Home'
import { Bio } from './pages/Bio'
import { SerieIndex } from './pages/SerieIndex'
import { SerieDetail } from './pages/SerieDetail'
import { OperaDetail } from './pages/OperaDetail'
import { Edizioni } from './pages/Edizioni'
import { Mostre } from './pages/Mostre'
import { Fotografia } from './pages/Fotografia'
import { NotFound } from './pages/NotFound'
import { DevScena } from './dev/DevScena'
import { DevBioTv } from './dev/DevBioTv'

/** Route reali (ARCHITECTURE.md §5). Ogni route è una pagina DOM (vista lista); in modo 3D il Layout monta anche Stage e SceneRouter. */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="bio" element={<Bio />} />
          <Route path="about" element={<Navigate to="/bio" replace />} />
          <Route path="serie" element={<SerieIndex />} />
          <Route path="serie/serie-01" element={<Navigate to="/serie/2023-2025" replace />} />
          <Route path="serie/serie-02" element={<Navigate to="/serie/roundabout" replace />} />
          <Route path="serie/serie-03" element={<Navigate to="/serie/bustine-di-te" replace />} />
          <Route path="serie/serie-04" element={<Navigate to="/serie" replace />} />
          <Route path="serie/serie-05" element={<Navigate to="/serie" replace />} />
          <Route path="serie/:slug" element={<SerieDetail />} />
          <Route path="opere/:slug" element={<OperaDetail />} />
          <Route path="edizioni" element={<Edizioni />} />
          <Route path="edizioni/:slug" element={<Edizioni />} />
          <Route path="mostre" element={<Mostre />} />
          <Route path="mostre/:slug" element={<Mostre />} />
          <Route path="fotografia" element={<Fotografia />} />
          {import.meta.env.DEV && <Route path="dev/scena" element={<DevScena />} />}
          {import.meta.env.DEV && <Route path="dev/bio-tv" element={<DevBioTv />} />}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
