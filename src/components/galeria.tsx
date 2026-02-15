import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageIcon } from "lucide-react"

export function Galeria() {
  return (
    <div className="min-h-screen p-4 lg:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ImageIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Galería</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Galería</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Contenido de galería próximamente...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
