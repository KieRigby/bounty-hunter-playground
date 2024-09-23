'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MoreVertical, MapPin } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import dynamic from 'next/dynamic'

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false })
const useMapEvents = dynamic(() => import('react-leaflet').then((mod) => mod.useMapEvents), { ssr: false })

// Mock data for clients
const initialClients = [
  { id: 1, name: "Alice", level: 10, status: "online", lastLogin: "2023-09-22", avatar: "/placeholder.svg?height=40&width=40", location: [51.505, -0.09] },
  { id: 2, name: "Bob", level: 8, status: "offline", lastLogin: "2023-09-21", avatar: "/placeholder.svg?height=40&width=40", location: [51.51, -0.1] },
  { id: 3, name: "Charlie", level: 15, status: "online", lastLogin: "2023-09-23", avatar: "/placeholder.svg?height=40&width=40", location: [51.515, -0.09] },
  { id: 4, name: "Diana", level: 12, status: "away", lastLogin: "2023-09-20", avatar: "/placeholder.svg?height=40&width=40", location: [51.52, -0.11] },
  { id: 5, name: "Ethan", level: 5, status: "offline", lastLogin: "2023-09-19", avatar: "/placeholder.svg?height=40&width=40", location: [51.5, -0.12] },
]

function DraggableMarker({ position, setPosition }) {
  const markerRef = useRef(null)
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          setPosition(marker.getLatLng())
        }
      },
    }),
    [setPosition],
  )

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    >
      <Popup minWidth={90}>
        <span>Drag to update location</span>
      </Popup>
    </Marker>
  )
}

export function Dashboard() {
  const [clients, setClients] = useState(initialClients)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState(clients[0])
  const [activeTab, setActiveTab] = useState("details")

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'offline':
        return 'bg-gray-500'
      case 'away':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const updateClientLocation = (newLocation) => {
    setClients(prevClients =>
      prevClients.map(client =>
        client.id === selectedClient.id
          ? { ...client, location: [newLocation.lat, newLocation.lng] }
          : client
      )
    )
    setSelectedClient(prevClient => ({ ...prevClient, location: [newLocation.lat, newLocation.lng] }))
  }

  useEffect(() => {
    // This is needed to properly render the map after the component mounts
    const L = require('leaflet')
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
      iconUrl: '/leaflet/images/marker-icon.png',
      shadowUrl: '/leaflet/images/marker-shadow.png',
    })
  }, [])

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Game Clients</h1>
          <Button className="w-full mb-4">+ Add New Client</Button>
          <div className="relative mb-4">
            <Input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-120px)]">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className={`p-4 cursor-pointer hover:bg-gray-100 ${selectedClient.id === client.id ? 'bg-gray-100' : ''}`}
              onClick={() => setSelectedClient(client)}
            >
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={client.avatar} alt={client.name} />
                  <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                  <p className="text-sm text-gray-500 truncate">Level {client.level}</p>
                </div>
                <Badge className={`${getStatusColor(client.status)} text-white`}>
                  {client.status}
                </Badge>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="details">Client Details</TabsTrigger>
            <TabsTrigger value="all-map">All Clients Map</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            {selectedClient && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedClient.avatar} alt={selectedClient.name} />
                    <AvatarFallback>{selectedClient.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedClient.name}</h3>
                    <p className="text-gray-500">Level {selectedClient.level}</p>
                  </div>
                  <Badge className={`${getStatusColor(selectedClient.status)} text-white ml-auto`}>
                    {selectedClient.status}
                  </Badge>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p>{selectedClient.lastLogin}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Location</p>
                  <div className="h-64 rounded-lg overflow-hidden">
                    <MapContainer center={selectedClient.location} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <DraggableMarker
                        position={selectedClient.location}
                        setPosition={updateClientLocation}
                      />
                    </MapContainer>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button>Send Message</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View full profile</DropdownMenuItem>
                      <DropdownMenuItem>Edit client details</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Ban client</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="all-map">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">All Clients Map</h3>
              <div className="h-[calc(100vh-250px)] rounded-lg overflow-hidden">
                <MapContainer center={[51.505, -0.09]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {clients.map((client) => (
                    <Marker key={client.id} position={client.location}>
                      <Popup>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={client.avatar} alt={client.name} />
                            <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{client.name}</p>
                            <p className="text-sm text-gray-500">Level {client.level}</p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
