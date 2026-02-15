import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"

export function Productos() {
  return (
    <div className="min-h-screen p-4 lg:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Productos</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Contenido de productos próximamente...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
