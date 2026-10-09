import { useEffect } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { ReviewPage } from "@/pages/ReviewPage"
import { AddPage } from "@/pages/AddPage"
import { CollectionPage } from "@/pages/CollectionPage"
import { SwipePage } from "./pages/SwipePage"

export default function App() {
  useEffect(() => document.documentElement.classList.add("dark"), [])
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ReviewPage />} />
          <Route path="add" element={<AddPage />} />
          <Route path="collection" element={<CollectionPage />} />
          <Route path="cards" element={<SwipePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
