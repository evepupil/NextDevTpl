import type { DemoData, DemoDataPatch } from "./types.js";
import {
  hasOwn,
  invalidDemoData,
  readRecord,
  readSafeInteger,
  readUtcTimestamp,
} from "./validation/common.js";
import {
  assertCreditBalance,
  assertUnexpiredCreditBatches,
  parseDemoBillingHistory,
  parseDemoCredits,
  parseDemoCreditsPatch,
  parseDemoPlanState,
  parseDemoPlanStatePatch,
  parseDemoTicketList,
  parseDemoUser,
  parseDemoUserPatch,
} from "./validation/records.js";

const ROOT_KEYS = ["schemaVersion", "snapshotAt", "workspace", "support"];
const WORKSPACE_KEYS = ["user", "plan", "credits", "billingHistory"];
const CREDITS_ROOT_KEYS = [
  "balance",
  "totalEarned",
  "totalSpent",
  "batches",
  "transactions",
];
const SUPPORT_KEYS = ["tickets"];

function readSchemaVersion(value: unknown, path: string): 1 {
  const version = readSafeInteger(value, path, 1);
  if (version !== 1) {
    return invalidDemoData(path, "must be schema version 1");
  }
  return 1;
}

function validateRelationships(data: DemoData): void {
  assertCreditBalance(data.workspace.credits, "demo.workspace.credits");
  assertUnexpiredCreditBatches(
    data.workspace.credits.batches,
    data.snapshotAt,
    "demo.workspace.credits.batches"
  );
}

export function validateDemoData(input: unknown): DemoData {
  const root = readRecord(input, "demo", ROOT_KEYS);
  const schemaVersion = readSchemaVersion(
    root.schemaVersion,
    "demo.schemaVersion"
  );
  const snapshotAt = readUtcTimestamp(root.snapshotAt, "demo.snapshotAt");

  const workspace = readRecord(
    root.workspace,
    "demo.workspace",
    WORKSPACE_KEYS
  );
  const creditsRoot = readRecord(
    workspace.credits,
    "demo.workspace.credits",
    CREDITS_ROOT_KEYS
  );
  const credits = parseDemoCredits(creditsRoot, "demo.workspace.credits");
  const support = readRecord(root.support, "demo.support", SUPPORT_KEYS);

  const data: DemoData = {
    schemaVersion,
    snapshotAt,
    workspace: {
      user: parseDemoUser(workspace.user, "demo.workspace.user"),
      plan: parseDemoPlanState(workspace.plan, "demo.workspace.plan"),
      credits,
      billingHistory: parseDemoBillingHistory(
        workspace.billingHistory,
        "demo.workspace.billingHistory"
      ),
    },
    support: {
      tickets: parseDemoTicketList(support.tickets, "demo.support.tickets"),
    },
  };

  validateRelationships(data);
  return data;
}

function parseWorkspacePatch(
  value: unknown,
  path: string
): NonNullable<DemoDataPatch["workspace"]> {
  const record = readRecord(value, path, WORKSPACE_KEYS, []);
  return {
    ...(hasOwn(record, "user")
      ? { user: parseDemoUserPatch(record.user, `${path}.user`) }
      : {}),
    ...(hasOwn(record, "plan")
      ? { plan: parseDemoPlanStatePatch(record.plan, `${path}.plan`) }
      : {}),
    ...(hasOwn(record, "credits")
      ? { credits: parseDemoCreditsPatch(record.credits, `${path}.credits`) }
      : {}),
    ...(hasOwn(record, "billingHistory")
      ? {
          billingHistory: parseDemoBillingHistory(
            record.billingHistory,
            `${path}.billingHistory`
          ),
        }
      : {}),
  };
}

function parseSupportPatch(
  value: unknown,
  path: string
): NonNullable<DemoDataPatch["support"]> {
  const record = readRecord(value, path, SUPPORT_KEYS, []);
  return {
    ...(hasOwn(record, "tickets")
      ? { tickets: parseDemoTicketList(record.tickets, `${path}.tickets`) }
      : {}),
  };
}

export function parseDemoDataPatch(input: unknown): DemoDataPatch {
  const root = readRecord(input, "demo patch", ROOT_KEYS, ["schemaVersion"]);
  const schemaVersion = readSchemaVersion(
    root.schemaVersion,
    "demo patch.schemaVersion"
  );
  return {
    schemaVersion,
    ...(hasOwn(root, "snapshotAt")
      ? {
          snapshotAt: readUtcTimestamp(
            root.snapshotAt,
            "demo patch.snapshotAt"
          ),
        }
      : {}),
    ...(hasOwn(root, "workspace")
      ? {
          workspace: parseWorkspacePatch(
            root.workspace,
            "demo patch.workspace"
          ),
        }
      : {}),
    ...(hasOwn(root, "support")
      ? { support: parseSupportPatch(root.support, "demo patch.support") }
      : {}),
  };
}
