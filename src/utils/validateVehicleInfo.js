export const createEmptyVehicleInfo = () => ({
  category: '',
  plate: '',
  make: '',
  model: '',
  year: '',
  color: '',
  passengerCapacity: '',
  photo: '',
});

export function validateVehicleInfo(values, copy, currentYear = new Date().getFullYear()) {
  const errors = {};

  if (!copy.vehicleCategories.some(({ value }) => value === values.category)) {
    errors.category = copy.errors.vehicleCategoryRequired;
  }

  if (!values.plate) errors.plate = copy.errors.vehiclePlateRequired;
  else if (!/^[A-Z]{3}\d{3}$/.test(values.plate)) errors.plate = copy.errors.vehiclePlateInvalid;

  if (!values.make.trim()) errors.make = copy.errors.vehicleMakeRequired;
  else if (Array.from(values.make.trim()).length > 30) errors.make = copy.errors.vehicleMakeLength;

  if (!values.model.trim()) errors.model = copy.errors.vehicleModelRequired;
  else if (Array.from(values.model.trim()).length > 30) errors.model = copy.errors.vehicleModelLength;

  if (!values.year) errors.year = copy.errors.vehicleYearRequired;
  else if (!/^\d{4}$/.test(values.year)) errors.year = copy.errors.vehicleYearInvalid;
  else if (Number(values.year) > currentYear) errors.year = copy.errors.vehicleYearFuture;

  if (!copy.vehicleColors.some(({ value }) => value === values.color)) {
    errors.color = copy.errors.vehicleColorRequired;
  }

  if (!values.passengerCapacity) errors.passengerCapacity = copy.errors.vehicleCapacityRequired;
  else if (!/^\d+$/.test(values.passengerCapacity) || Number(values.passengerCapacity) < 1) {
    errors.passengerCapacity = copy.errors.vehicleCapacityInvalid;
  } else if (values.category === 'xl' && Number(values.passengerCapacity) < 6) {
    errors.passengerCapacity = copy.errors.vehicleCapacityXL;
  }

  if (!values.photo) errors.photo = copy.errors.vehiclePhotoRequired;
  return errors;
}
