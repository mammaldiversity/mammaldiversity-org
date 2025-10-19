export function matchIUCNRedlistStatus(status: string) {
  switch (status) {
    case "LC":
      return "Least Concern";
    case "NT":
      return "Near Threatened";
    case "VU":
      return "Vulnerable";
    case "EN":
      return "Endangered";
    case "CR":
      return "Critically Endangered";
    case "EW":
      return "Extinct in the Wild";
    case "EX":
      return "Extinct";
    default:
      return "Not Evaluated";
  }
}
