"use client"

import * as React from "react"

import {
  ADMIN_NAME,
  seedAssets,
  seedCategories,
  seedDepartments,
  seedEmployees,
  seedInternetData,
  seedLocations,
  seedSimCards,
  seedSimPackages,
} from "@/lib/mock-data"
import type {
  Asset,
  AssetInput,
  Category,
  Department,
  Employee,
  InternetData,
  InternetDataInput,
  Location,
  LocationInput,
  SimCard,
  SimCardInput,
  SimPackage,
} from "@/lib/types"

function today() {
  return new Date().toISOString().slice(0, 10)
}

function nextId(items: { id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

type DataStore = {
  assets: Asset[]
  categories: Category[]
  departments: Department[]
  employees: Employee[]
  simPackages: SimPackage[]
  simCards: SimCard[]
  locations: Location[]
  internetData: InternetData[]
  createAsset: (input: AssetInput) => number
  updateAsset: (id: number, input: AssetInput) => void
  deleteAsset: (id: number) => void
  createSimCard: (input: SimCardInput) => void
  updateSimCard: (id: number, input: SimCardInput) => void
  deleteSimCard: (id: number) => void
  createCategory: (name: string) => void
  updateCategory: (id: number, name: string) => void
  deleteCategory: (id: number) => void
  createDepartment: (name: string, parentId: number | null) => void
  updateDepartment: (
    id: number,
    name: string,
    parentId: number | null
  ) => void
  deleteDepartment: (id: number) => void
  createEmployee: (name: string, departmentId: number | null) => void
  updateEmployee: (id: number, name: string, departmentId: number | null) => void
  deleteEmployee: (id: number) => void
  createSimPackage: (name: string) => void
  updateSimPackage: (id: number, name: string) => void
  deleteSimPackage: (id: number) => void
  createLocation: (input: LocationInput) => void
  updateLocation: (id: number, input: LocationInput) => void
  deleteLocation: (id: number) => void
  createInternetData: (input: InternetDataInput) => void
  updateInternetData: (id: number, input: InternetDataInput) => void
  deleteInternetData: (id: number) => void
}

const DataStoreContext = React.createContext<DataStore | null>(null)

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = React.useState<Asset[]>(seedAssets)
  const [categories, setCategories] = React.useState<Category[]>(seedCategories)
  const [departments, setDepartments] =
    React.useState<Department[]>(seedDepartments)
  const [employees, setEmployees] = React.useState<Employee[]>(seedEmployees)
  const [simPackages, setSimPackages] =
    React.useState<SimPackage[]>(seedSimPackages)
  const [simCards, setSimCards] = React.useState<SimCard[]>(seedSimCards)
  const [locations, setLocations] = React.useState<Location[]>(seedLocations)
  const [internetData, setInternetData] =
    React.useState<InternetData[]>(seedInternetData)

  const store = React.useMemo<DataStore>(() => {
    return {
      assets,
      categories,
      departments,
      employees,
      simPackages,
      simCards,
      locations,
      internetData,
      createAsset(input) {
        const id = nextId(assets)
        setAssets((items) => [
          ...items,
          {
            ...input,
            id,
            updatedBy: ADMIN_NAME,
            createdAt: today(),
            updatedAt: today(),
          },
        ])
        return id
      },
      updateAsset(id, input) {
        setAssets((items) =>
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...input,
                  updatedBy: ADMIN_NAME,
                  updatedAt: today(),
                }
              : item
          )
        )
      },
      deleteAsset(id) {
        setAssets((items) => items.filter((item) => item.id !== id))
      },
      createSimCard(input) {
        setSimCards((items) => [
          ...items,
          {
            ...input,
            id: nextId(items),
            createdAt: today(),
            updatedAt: today(),
          },
        ])
      },
      updateSimCard(id, input) {
        setSimCards((items) =>
          items.map((item) =>
            item.id === id ? { ...item, ...input, updatedAt: today() } : item
          )
        )
      },
      deleteSimCard(id) {
        setSimCards((items) => items.filter((item) => item.id !== id))
      },
      createCategory(name) {
        setCategories((items) => [...items, { id: nextId(items), name }])
      },
      updateCategory(id, name) {
        setCategories((items) =>
          items.map((item) => (item.id === id ? { ...item, name } : item))
        )
      },
      deleteCategory(id) {
        setCategories((items) => items.filter((item) => item.id !== id))
      },
      createDepartment(name, parentId) {
        setDepartments((items) => [
          ...items,
          { id: nextId(items), name, parentId, createdAt: today() },
        ])
      },
      updateDepartment(id, name, parentId) {
        setDepartments((items) =>
          items.map((item) =>
            item.id === id ? { ...item, name, parentId } : item
          )
        )
      },
      deleteDepartment(id) {
        setDepartments((items) => items.filter((item) => item.id !== id))
      },
      createEmployee(name, departmentId) {
        setEmployees((items) => [
          ...items,
          { id: nextId(items), name, departmentId, createdAt: today() },
        ])
      },
      updateEmployee(id, name, departmentId) {
        setEmployees((items) =>
          items.map((item) =>
            item.id === id ? { ...item, name, departmentId } : item
          )
        )
      },
      deleteEmployee(id) {
        setEmployees((items) => items.filter((item) => item.id !== id))
      },
      createSimPackage(name) {
        setSimPackages((items) => [...items, { id: nextId(items), name }])
      },
      updateSimPackage(id, name) {
        setSimPackages((items) =>
          items.map((item) => (item.id === id ? { ...item, name } : item))
        )
      },
      deleteSimPackage(id) {
        setSimPackages((items) => items.filter((item) => item.id !== id))
      },
      createLocation(input) {
        setLocations((items) => [
          ...items,
          { ...input, id: nextId(items), createdAt: today() },
        ])
      },
      updateLocation(id, input) {
        setLocations((items) =>
          items.map((item) => (item.id === id ? { ...item, ...input } : item))
        )
      },
      deleteLocation(id) {
        setLocations((items) => items.filter((item) => item.id !== id))
      },
      createInternetData(input) {
        setInternetData((items) => [
          ...items,
          {
            ...input,
            id: nextId(items),
            createdAt: today(),
            updatedAt: today(),
          },
        ])
      },
      updateInternetData(id, input) {
        setInternetData((items) =>
          items.map((item) =>
            item.id === id ? { ...item, ...input, updatedAt: today() } : item
          )
        )
      },
      deleteInternetData(id) {
        setInternetData((items) => items.filter((item) => item.id !== id))
      },
    }
  }, [
    assets,
    categories,
    departments,
    employees,
    simPackages,
    simCards,
    locations,
    internetData,
  ])

  return (
    <DataStoreContext.Provider value={store}>
      {children}
    </DataStoreContext.Provider>
  )
}

export function useDataStore() {
  const store = React.useContext(DataStoreContext)
  if (!store) {
    throw new Error("useDataStore harus dipakai di dalam DataStoreProvider")
  }
  return store
}
