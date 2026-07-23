import { serve } from "inngest/next";

import { inngest } from "./client";
import { functions } from "./functions";

export const inngestHandlers = serve({ client: inngest, functions });
