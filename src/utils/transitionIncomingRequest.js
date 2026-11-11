export function transitionIncomingRequest(request, status, cancellationReason = null) {
  if (request.status !== 'requested' || !['accepted', 'cancelled'].includes(status)) return request;
  return { ...request, status, cancellationReason };
}
