import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type Subjects =
  | 'Quotation'
  | 'CompanySettings'
  | 'Product'
  | 'IntegratedProduct'
  | 'StructureCatalog'
  | 'Component'
  | 'User'
  | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export interface AuthUser {
  id: string;
  name?: string | null;
  email: string;
  role?: string | null;
}

/**
 * Builds the CASL Ability for the given user and role.
 * Roles:
 * - 'admin' / 'super_admin': Complete permissions across all resources.
 * - 'sales' / 'user': Can create, view, update quotations; read-only for catalogs and company details.
 * - 'viewer': Read-only access to quotations and company information.
 */
export function defineAbilityFor(user?: AuthUser | null): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  const role = (user?.role || 'sales').toLowerCase();

  if (role === 'admin' || role === 'super_admin') {
    // Admin has full control
    can('manage', 'all');
  } else if (role === 'sales' || role === 'salesperson' || role === 'user') {
    // Sales can generate and edit quotations, read catalogs
    can(['create', 'read', 'update'], 'Quotation');
    can('read', ['CompanySettings', 'Product', 'IntegratedProduct', 'StructureCatalog', 'Component']);
    cannot('delete', 'all');
    cannot(['create', 'update', 'delete'], ['CompanySettings', 'User', 'Product', 'StructureCatalog']);
  } else {
    // Read-only viewer
    can('read', ['Quotation', 'CompanySettings', 'Product', 'IntegratedProduct', 'StructureCatalog']);
    cannot(['create', 'update', 'delete'], 'all');
  }

  return build();
}
