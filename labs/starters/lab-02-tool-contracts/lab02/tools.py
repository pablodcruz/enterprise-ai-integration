class IncidentTools:
    def __init__(self, incidents: list[dict]):
        self.incidents = incidents

    def search_incidents(self, arguments):
        # TODO: validate, filter, bound, and return a structured result.
        raise NotImplementedError

    def draft_incident_comment(self, arguments):
        # TODO: return a canonical, hashed proposal without mutating an incident.
        raise NotImplementedError
