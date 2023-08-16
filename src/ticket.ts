export type priorityTypes = "S1" | "S2" | "S3" | "S4" | "S5";
export type ticketStatusTypes = "unassigned" | "inProgress" | "SLANotMet" | "waitingForCustomer" | "closed";
export const ticketStatuses : ticketStatusTypes[] = ["unassigned", "inProgress", "SLANotMet", "waitingForCustomer", "closed"];
export type supportEngineersType = "John" | "Mary" | "Ade" | "Mike" | "Steve"
export const supportEngineers : supportEngineersType[] = ["John",  "Mary", "Ade", "Mike", "Steve"];


export interface Ticket {
    ticketNumber: number,
    customerId: number,
    responseMinSLA: number, //response time in min SLA
    priority: priorityTypes,
    status: ticketStatusTypes,
    assignedTo: supportEngineersType | null,
  };