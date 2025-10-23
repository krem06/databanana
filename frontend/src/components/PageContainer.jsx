export default function PageContainer({ children, maxWidth = "6xl" }) {
  const maxWidthClass = `max-w-${maxWidth}`
  
  return (
    <div className="min-h-screen bg-background">
      <div className={`${maxWidthClass} mx-auto px-6 py-8`}>
        {children}
      </div>
    </div>
  )
}