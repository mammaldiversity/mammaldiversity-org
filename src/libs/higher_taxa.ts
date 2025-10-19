/*
Higher taxa classification for mammals
*/
import { getHierarchicalTaxonData, type OrderData } from "./taxon_table";

export interface SubclassData {
  subclass: string;
  infraclass: InfraClassData[];
}

interface InfraClassData {
  infraclass: string;
  orders: OrderData[];
}


/**
 * Filters a record of order data to retrieve orders belonging to a specific infraclass.
 * @param {Record<string, OrderData>} data - A map of order names to order data.
 * @param {string} infraClass - The name of the infraclass to filter by.
 * @returns {OrderData[]} An array of order data that belongs to the specified infraclass.
 */
function getInfraClassData(data: Record<string, OrderData>, infraClass: string): OrderData[] {
  return Object.values(data).filter(
    (item: OrderData) => item.infraclass && item.infraclass.includes(infraClass)
  );
}

/**
 * Filters a record of order data to retrieve orders belonging to a specific subclass.
 * @param {Record<string, OrderData>} data - A map of order names to order data.
 * @param {string} subclass - The name of the subclass to filter by.
 * @returns {OrderData[]} An array of order data that belongs to the specified subclass.
 */
function getSubclassData(data: Record<string, OrderData>, subclass: string): OrderData[] {
  return Object.values(data).filter(
    (item: OrderData) => item.subclass && item.subclass.includes(subclass)
  );
}

/**
 * Builds a hierarchical data structure of higher taxa, including subclasses, infraclasses, and orders.
 * @returns {Record<string, SubclassData>} A map of subclass names to subclass data, which includes infraclasses and orders.
 */
function getHigherTaxonData(): Record<string, SubclassData> {
  const higherTaxaData: Record<string, SubclassData> = {};

  const orderData = getHierarchicalTaxonData();
  const infraClasses = new Set<string>();

  for (const order of Object.values(orderData)) {
    if (order.infraclass) {
      infraClasses.add(order.infraclass);
    }
  }

  for (const infraclass of infraClasses) {
    const ordersInInfraClass = getInfraClassData(orderData, infraclass);
    const subclasses = Array.from(new Set(ordersInInfraClass.map(order => order.subclass).filter(Boolean)));

    for (const subclass of subclasses) {
      const ordersInSubclass = getSubclassData(orderData, subclass);
      const infraclasses = Array.from(new Set(ordersInSubclass.map(order => order.infraclass).filter(Boolean)));

      const infraClassDataArr: InfraClassData[] = infraclasses.map((infraclass) => ({
        infraclass,
        orders: getInfraClassData(orderData, infraclass)
      }));

      higherTaxaData[subclass] = {
        subclass,
        infraclass: infraClassDataArr
      };
    }
  }

  return higherTaxaData;
}

export { getHigherTaxonData };