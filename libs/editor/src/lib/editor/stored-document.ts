import { QalmaDocument } from '../prosemirror/json';

export const QALMA_STORED_DOCUMENT_FORMAT = 'qalma';
export const QALMA_STORED_DOCUMENT_FORMAT_VERSION = 1;

export interface QalmaStoredDocument {
  format: typeof QALMA_STORED_DOCUMENT_FORMAT;
  formatVersion: typeof QALMA_STORED_DOCUMENT_FORMAT_VERSION;
  schemaVersion: number;
  schemaPlugins: readonly string[];
  document: QalmaDocument;
}

export interface QalmaDocumentMigration {
  fromVersion: number;
  toVersion: number;
  migrate(document: QalmaDocument): QalmaDocument;
}

export function createMigrationRegistry(
  currentSchemaVersion: number,
  migrations: readonly QalmaDocumentMigration[],
): ReadonlyMap<number, QalmaDocumentMigration> {
  assertPositiveInteger(currentSchemaVersion, 'schemaVersion');

  const registry = new Map<number, QalmaDocumentMigration>();

  for (const migration of migrations) {
    assertPositiveInteger(migration.fromVersion, 'migration.fromVersion');
    assertPositiveInteger(migration.toVersion, 'migration.toVersion');

    if (migration.toVersion !== migration.fromVersion + 1) {
      throw new Error(
        `QALMA document migration ${migration.fromVersion} → ${migration.toVersion} must advance exactly one schema version.`,
      );
    }

    if (migration.toVersion > currentSchemaVersion) {
      throw new Error(
        `QALMA document migration targets schema version ${migration.toVersion}, but the editor is configured for version ${currentSchemaVersion}.`,
      );
    }

    if (registry.has(migration.fromVersion)) {
      throw new Error(
        `Duplicate QALMA document migration from schema version ${migration.fromVersion}.`,
      );
    }

    registry.set(migration.fromVersion, migration);
  }

  return registry;
}

export function migrateStoredDocument(
  storedDocument: QalmaStoredDocument,
  currentSchemaVersion: number,
  migrations: ReadonlyMap<number, QalmaDocumentMigration>,
): QalmaDocument {
  assertStoredDocument(storedDocument);

  if (storedDocument.schemaVersion > currentSchemaVersion) {
    throw new Error(
      `Cannot load QALMA schema version ${storedDocument.schemaVersion} with editor schema version ${currentSchemaVersion}. Upgrade the editor first.`,
    );
  }

  let document = cloneDocument(storedDocument.document);

  for (
    let version = storedDocument.schemaVersion;
    version < currentSchemaVersion;
    version += 1
  ) {
    const migration = migrations.get(version);

    if (!migration) {
      throw new Error(
        `Missing QALMA document migration from schema version ${version} to ${version + 1}.`,
      );
    }

    document = migration.migrate(cloneDocument(document));
    assertDocument(document);
  }

  return document;
}

function assertStoredDocument(
  storedDocument: QalmaStoredDocument,
): asserts storedDocument is QalmaStoredDocument {
  if (
    !storedDocument ||
    typeof storedDocument !== 'object' ||
    storedDocument.format !== QALMA_STORED_DOCUMENT_FORMAT
  ) {
    throw new Error(
      `Unsupported stored document format. Expected "${QALMA_STORED_DOCUMENT_FORMAT}".`,
    );
  }

  if (storedDocument.formatVersion !== QALMA_STORED_DOCUMENT_FORMAT_VERSION) {
    throw new Error(
      `Unsupported QALMA stored document format version ${String(storedDocument.formatVersion)}.`,
    );
  }

  assertPositiveInteger(storedDocument.schemaVersion, 'stored schemaVersion');

  if (
    !Array.isArray(storedDocument.schemaPlugins) ||
    storedDocument.schemaPlugins.some((plugin) => typeof plugin !== 'string')
  ) {
    throw new Error('QALMA stored document schemaPlugins must be strings.');
  }

  assertDocument(storedDocument.document);
}

function assertDocument(document: QalmaDocument): void {
  if (
    !document ||
    typeof document !== 'object' ||
    typeof document.type !== 'string'
  ) {
    throw new Error(
      'A QALMA stored document must contain valid document JSON.',
    );
  }
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`QALMA ${name} must be a positive integer.`);
  }
}

function cloneDocument(document: QalmaDocument): QalmaDocument {
  return JSON.parse(JSON.stringify(document)) as QalmaDocument;
}
