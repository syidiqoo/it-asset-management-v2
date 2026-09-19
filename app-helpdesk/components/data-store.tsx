"use client"

import * as React from "react"

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

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? "Request failed.")
  }
  return data as T
}

type DataStore = {
  loading: boolean
  error: string | null
  assets: Asset[]
  categories: Category[]
  departments: Department[]
  employees: Employee[]
  simPackages: SimPackage[]
  simCards: SimCard[]
  locations: Location[]
  internetData: InternetData[]
  createAsset: (input: AssetInput) => Promise<number>
  updateAsset: (id: number, input: AssetInput) => Promise<void>
  deleteAsset: (id: number) => Promise<void>
  createSimCard: (input: SimCardInput) => Promise<void>
  updateSimCard: (id: number, input: SimCardInput) => Promise<void>
  deleteSimCard: (id: number) => Promise<void>
  createCategory: (name: string) => Promise<void>
  updateCategory: (id: number, name: string) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
  createDepartment: (name: string, parentId: number | null) => Promise<void>
  updateDepartment: (
    id: number,
    name: string,
    parentId: number | null
  ) => Promise<void>
  deleteDepartment: (id: number) => Promise<void>
  createEmployee: (name: string, departmentId: number | null) => Promise<void>
  updateEmployee: (
    id: number,
    name: string,
    departmentId: number | null
  ) => Promise<void>
  deleteEmployee: (id: number) => Promise<void>
  createSimPackage: (name: string) => Promise<void>
  updateSimPackage: (id: number, name: string) => Promise<void>
  deleteSimPackage: (id: number) => Promise<void>
  createLocation: (input: LocationInput) => Promise<void>
  updateLocation: (id: number, input: LocationInput) => Promise<void>
  deleteLocation: (id: number) => Promise<void>
  createInternetData: (input: InternetDataInput) => Promise<void>
  updateInternetData: (id: number, input: InternetDataInput) => Promise<void>
  deleteInternetData: (id: number) => Promise<void>
  importDepartments: (rows: string[][]) => Promise<string>
  importEmployees: (rows: string[][]) => Promise<string>
  importAssets: (rows: string[][]) => Promise<string>
  importInternetData: (rows: string[][]) => Promise<string>
  importSimCards: (rows: string[][]) => Promise<string>
  refresh: () => Promise<void>
}

const DataStoreContext = React.createContext<DataStore | null>(null)

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [assets, setAssets] = React.useState<Asset[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [simPackages, setSimPackages] = React.useState<SimPackage[]>([])
  const [simCards, setSimCards] = React.useState<SimCard[]>([])
  const [locations, setLocations] = React.useState<Location[]>([])
  const [internetData, setInternetData] = React.useState<InternetData[]>([])

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        assetsData,
        categoriesData,
        departmentsData,
        employeesData,
        simPackagesData,
        simCardsData,
        locationsData,
        internetData,
      ] = await Promise.all([
        request<Asset[]>("/api/assets"),
        request<Category[]>("/api/categories"),
        request<Department[]>("/api/departments"),
        request<Employee[]>("/api/employees"),
        request<SimPackage[]>("/api/sim-packages"),
        request<SimCard[]>("/api/sim-cards"),
        request<Location[]>("/api/locations"),
        request<InternetData[]>("/api/internet"),
      ])
      setAssets(assetsData)
      setCategories(categoriesData)
      setDepartments(departmentsData)
      setEmployees(employeesData)
      setSimPackages(simPackagesData)
      setSimCards(simCardsData)
      setLocations(locationsData)
      setInternetData(internetData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  const store = React.useMemo<DataStore>(() => {
    return {
      loading,
      error,
      assets,
      categories,
      departments,
      employees,
      simPackages,
      simCards,
      locations,
      internetData,
      refresh,
      async createAsset(input) {
        const item = await request<Asset>("/api/assets", {
          method: "POST",
          body: JSON.stringify(input),
        })
        setAssets((items) => [...items, item])
        return item.id
      },
      async updateAsset(id, input) {
        const item = await request<Asset>(`/api/assets/${id}`, {
          method: "PUT",
          body: JSON.stringify(input),
        })
        setAssets((items) => items.map((x) => (x.id === id ? item : x)))
      },
      async deleteAsset(id) {
        await request(`/api/assets/${id}`, { method: "DELETE" })
        setAssets((items) => items.filter((item) => item.id !== id))
      },
      async createSimCard(input) {
        const item = await request<SimCard>("/api/sim-cards", {
          method: "POST",
          body: JSON.stringify(input),
        })
        setSimCards((items) => [...items, item])
      },
      async updateSimCard(id, input) {
        const item = await request<SimCard>(`/api/sim-cards/${id}`, {
          method: "PUT",
          body: JSON.stringify(input),
        })
        setSimCards((items) => items.map((x) => (x.id === id ? item : x)))
      },
      async deleteSimCard(id) {
        await request(`/api/sim-cards/${id}`, { method: "DELETE" })
        setSimCards((items) => items.filter((item) => item.id !== id))
      },
      async createCategory(name) {
        const item = await request<Category>("/api/categories", {
          method: "POST",
          body: JSON.stringify({ name }),
        })
        setCategories((items) => [...items, item])
      },
      async updateCategory(id, name) {
        const item = await request<Category>(`/api/categories/${id}`, {
          method: "PUT",
          body: JSON.stringify({ name }),
        })
        setCategories((items) => items.map((x) => (x.id === id ? item : x)))
      },
      async deleteCategory(id) {
        await request(`/api/categories/${id}`, { method: "DELETE" })
        setCategories((items) => items.filter((item) => item.id !== id))
      },
      async createDepartment(name, parentId) {
        const item = await request<Department>("/api/departments", {
          method: "POST",
          body: JSON.stringify({ name, parentId }),
        })
        setDepartments((items) => [...items, item])
      },
      async updateDepartment(id, name, parentId) {
        const item = await request<Department>(`/api/departments/${id}`, {
          method: "PUT",
          body: JSON.stringify({ name, parentId }),
        })
        setDepartments((items) => items.map((x) => (x.id === id ? item : x)))
      },
      async deleteDepartment(id) {
        await request(`/api/departments/${id}`, { method: "DELETE" })
        setDepartments((items) => items.filter((item) => item.id !== id))
      },
      async createEmployee(name, departmentId) {
        const item = await request<Employee>("/api/employees", {
          method: "POST",
          body: JSON.stringify({ name, departmentId }),
        })
        setEmployees((items) => [...items, item])
      },
      async updateEmployee(id, name, departmentId) {
        const item = await request<Employee>(`/api/employees/${id}`, {
          method: "PUT",
          body: JSON.stringify({ name, departmentId }),
        })
        setEmployees((items) => items.map((x) => (x.id === id ? item : x)))
      },
      async deleteEmployee(id) {
        await request(`/api/employees/${id}`, { method: "DELETE" })
        setEmployees((items) => items.filter((item) => item.id !== id))
      },
      async createSimPackage(name) {
        const item = await request<SimPackage>("/api/sim-packages", {
          method: "POST",
          body: JSON.stringify({ name }),
        })
        setSimPackages((items) => [...items, item])
      },
      async updateSimPackage(id, name) {
        const item = await request<SimPackage>(`/api/sim-packages/${id}`, {
          method: "PUT",
          body: JSON.stringify({ name }),
        })
        setSimPackages((items) => items.map((x) => (x.id === id ? item : x)))
      },
      async deleteSimPackage(id) {
        await request(`/api/sim-packages/${id}`, { method: "DELETE" })
        setSimPackages((items) => items.filter((item) => item.id !== id))
      },
      async createLocation(input) {
        const item = await request<Location>("/api/locations", {
          method: "POST",
          body: JSON.stringify(input),
        })
        setLocations((items) => [...items, item])
      },
      async updateLocation(id, input) {
        const item = await request<Location>(`/api/locations/${id}`, {
          method: "PUT",
          body: JSON.stringify(input),
        })
        setLocations((items) => items.map((x) => (x.id === id ? item : x)))
      },
      async deleteLocation(id) {
        await request(`/api/locations/${id}`, { method: "DELETE" })
        setLocations((items) => items.filter((item) => item.id !== id))
      },
      async createInternetData(input) {
        const item = await request<InternetData>("/api/internet", {
          method: "POST",
          body: JSON.stringify(input),
        })
        setInternetData((items) => [...items, item])
      },
      async updateInternetData(id, input) {
        const item = await request<InternetData>(`/api/internet/${id}`, {
          method: "PUT",
          body: JSON.stringify(input),
        })
        setInternetData((items) => items.map((x) => (x.id === id ? item : x)))
      },
      async deleteInternetData(id) {
        await request(`/api/internet/${id}`, { method: "DELETE" })
        setInternetData((items) =>
          items.filter((item) => item.id !== id)
        )
      },
      async importDepartments(rows) {
        const result = await request<{ created: number; skipped: number }>(
          "/api/departments/import",
          { method: "POST", body: JSON.stringify({ rows }) }
        )
        await refresh()
        return `Imported ${result.created} departments, skipped ${result.skipped} existing.`
      },
      async importEmployees(rows) {
        const result = await request<{ created: number; skipped: number }>(
          "/api/employees/import",
          { method: "POST", body: JSON.stringify({ rows }) }
        )
        await refresh()
        return `Imported ${result.created} employees, skipped ${result.skipped} existing.`
      },
      async importAssets(rows) {
        const result = await request<{ imported: number; skipped: number }>(
          "/api/assets/import",
          { method: "POST", body: JSON.stringify({ rows }) }
        )
        await refresh()
        return `Imported ${result.imported} assets, skipped ${result.skipped} with existing code.`
      },
      async importInternetData(rows) {
        const result = await request<{
          imported: number
          skipped: number
          unknownLocations: string[]
        }>("/api/internet/import", {
          method: "POST",
          body: JSON.stringify({ rows }),
        })
        await refresh()

        const unknown = result.unknownLocations
        const unknownNote =
          unknown.length > 0
            ? ` ${unknown.length} location(s) not in master, saved as unknown: ${unknown
                .slice(0, 5)
                .join(", ")}${unknown.length > 5 ? ", …" : ""}.`
            : ""

        return `Imported ${result.imported} internet records, skipped ${result.skipped} with existing Internet ID.${unknownNote}`
      },
      async importSimCards(rows) {
        const result = await request<{
          imported: number
          skipped: number
          skippedNoPhone: number
          skippedDuplicate: number
          unknownEmployees: string[]
          unknownDepartments: string[]
          unknownPackages: string[]
        }>("/api/sim-cards/import", {
          method: "POST",
          body: JSON.stringify({ rows }),
        })
        await refresh()

        const noPhoneNote =
          result.skippedNoPhone > 0
            ? ` ${result.skippedNoPhone} row(s) without MSISDN skipped.`
            : ""
        const duplicateNote =
          result.skippedDuplicate > 0
            ? ` ${result.skippedDuplicate} duplicate MSISDN row(s) skipped.`
            : ""

        const unknown = [
          result.unknownEmployees.length > 0
            ? `${result.unknownEmployees.length} name(s)`
            : null,
          result.unknownDepartments.length > 0
            ? `${result.unknownDepartments.length} department(s)`
            : null,
          result.unknownPackages.length > 0
            ? `${result.unknownPackages.length} package(s)`
            : null,
        ].filter(Boolean)

        const unknownNote =
          unknown.length > 0
            ? ` Not found in master, saved as available: ${unknown.join(", ")}.`
            : ""

        return `Imported ${result.imported} SIM cards, skipped ${result.skipped} with existing MSISDN.${noPhoneNote}${duplicateNote}${unknownNote}`
      },
    }
  }, [
    loading,
    error,
    assets,
    categories,
    departments,
    employees,
    simPackages,
    simCards,
    locations,
    internetData,
    refresh,
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
    throw new Error("useDataStore must be used within DataStoreProvider")
  }
  return store
}
