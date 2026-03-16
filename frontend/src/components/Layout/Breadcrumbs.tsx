import { Link } from "@tanstack/react-router"
import React from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface BreadcrumbProps {
  breadcrumbs: {
    path: string
    label: string
    isLast?: boolean
  }[]
  rootLabel?: string
}

export default function Breadcrumbs({
  breadcrumbs,
  rootLabel = "Home",
}: BreadcrumbProps) {
  return (
    <div className="py-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">{rootLabel}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.length > 0 && <BreadcrumbSeparator />}
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb.path}>
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!crumb.isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
