"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Download, Calendar, Image, ArrowLeft, Eye, EyeOff, CreditCard, Plus, X, ImageIcon } from "lucide-react"
import Link from "next/link"

interface BatchHistory {
  id: string
  date: string
  context: string
  template: string
  imageCount: number
  zipUrl: string
}

export default function Account() {
  const [userInfo, setUserInfo] = useState({
    email: "user@example.com",
    name: "John Doe",
    createdAt: "2024-01-15"
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  
  const [balance] = useState(25.50)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [batchHistory] = useState<BatchHistory[]>([
    {
      id: "batch-001",
      date: "2024-11-06",
      context: "Product photography for e-commerce",
      template: "Realistic",
      imageCount: 12,
      zipUrl: "/downloads/batch-001.zip"
    },
    {
      id: "batch-002", 
      date: "2024-11-05",
      context: "Abstract art for wall decoration",
      template: "Abstract",
      imageCount: 8,
      zipUrl: "/downloads/batch-002.zip"
    },
    {
      id: "batch-003",
      date: "2024-11-04", 
      context: "Portrait enhancement",
      template: "Artistic",
      imageCount: 6,
      zipUrl: "/downloads/batch-003.zip"
    }
  ])

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Account</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/gallery">
                <ImageIcon className="h-4 w-4" />
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userInfo.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="created">Member Since</Label>
                <Input
                  id="created"
                  value={userInfo.createdAt}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Button className="w-full">Update Profile</Button>
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Remove Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Account Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                <div className="text-3xl font-bold mb-1">${balance.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Available balance</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm">$5</Button>
                <Button variant="outline" size="sm">$10</Button>
                <Button variant="outline" size="sm">$20</Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline">$50</Button>
                <Button variant="outline">$100</Button>
              </div>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Funds
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Change Password */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
            <Button className="w-full md:w-auto">Update Password</Button>
          </CardContent>
        </Card>

        {/* Batch History */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generation History</CardTitle>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{batchHistory.length} batches</span>
                </div>
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  <span>{batchHistory.reduce((sum, batch) => sum + batch.imageCount, 0)} images</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {batchHistory.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{batch.date}</span>
                      <span className="text-xs bg-secondary px-2 py-1 rounded">
                        {batch.template}
                      </span>
                    </div>
                    <h4 className="font-medium mb-1">{batch.context}</h4>
                    <p className="text-sm text-muted-foreground">
                      {batch.imageCount} images generated
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={batch.zipUrl} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delete Account Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-background rounded-lg p-6 max-w-md m-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-destructive">Remove Account</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">This action cannot be undone. The following will be permanently deleted:</p>
                <div className="space-y-2 pl-4">
                  <p>• All account information and settings</p>
                  <p>• All generation history ({batchHistory.length} batches)</p>
                  <p>• All exclusively owned images and files</p>
                  <p>• Remaining account balance (${balance.toFixed(2)})</p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}