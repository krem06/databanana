import { Badge } from '@/components/ui/badge'

export default function PageHeader({ icon: Icon, badge, title, description }) {
  return (
    <div className="text-center mb-12">
      {badge && (
        <div className="flex items-center justify-center mb-6">
          <Badge className="text-sm px-4 py-2" variant="secondary">
            <Icon className="h-4 w-4 mr-2" />
            {badge}
          </Badge>
        </div>
      )}
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
        {title}
      </h1>
      {description && (
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}