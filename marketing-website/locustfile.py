from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 3)

    @task(1)
    def index(self):
        self.client.get("/")
        self.check_response()

    @task(2)
    def features(self):
        self.client.get("/features")
        self.check_response()

    @task(2)
    def pricing(self):
        self.client.get("/pricing")
        self.check_response()

    @task(1)
    def about(self):
        self.client.get("/about")
        self.check_response()

    @task(1)
    def contact(self):
        self.client.get("/contact")
        self.check_response()

    def check_response(self):
        if self.client.response.status_code != 200:
            self.environment.events.request_failure.fire(
                request_type="GET",
                name=self.client.request.path,
                response_time=self.client.response.elapsed.total_seconds() * 1000,
                exception=f"Unexpected status code: {self.client.response.status_code}"
            )
        elif self.client.response.elapsed.total_seconds() > 0.5:
            self.environment.events.request_failure.fire(
                request_type="GET",
                name=self.client.request.path,
                response_time=self.client.response.elapsed.total_seconds() * 1000,
                exception=f"Response time too high: {self.client.response.elapsed.total_seconds() * 1000}ms"
            ) 