"""Load testing with Locust."""

from locust import HttpUser, task, between
import random


class ScamGuardUser(HttpUser):
    """Simulate senior users interacting with ScamGuard."""

    wait_time = between(2, 5)

    def on_start(self):
        """Initialize user with token."""
        self.token = "YOUR_TEST_TOKEN_HERE"
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }
        self.user_id = f"test_user_{random.randint(1000, 9999)}"

    @task(3)
    def get_scenario(self):
        """Generate a learning scenario."""
        difficulties = ["easy", "medium", "hard"]
        difficulty = random.choice(difficulties)

        with self.client.post(
            "/api/v1/scenarios",
            json={"difficulty": difficulty},
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Scenario failed: {response.status_code}")

    @task(2)
    def analyze_message(self):
        """Analyze a message for scam indicators."""
        messages = [
            "You've won a prize! Click here to claim",
            "Your account has been compromised. Verify immediately.",
            "I'm stuck abroad and need money urgently",
            "Suspicious activity detected on your account",
        ]
        message = random.choice(messages)

        with self.client.post(
            "/api/v1/analysis",
            json={"message": message},
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Analysis failed: {response.status_code}")

    @task(1)
    def get_profile(self):
        """Get user profile."""
        with self.client.get(
            "/api/v1/profile",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Profile failed: {response.status_code}")

    @task(1)
    def get_analytics(self):
        """Get user analytics."""
        with self.client.get(
            "/api/v1/analytics/summary",
            headers=self.headers,
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Analytics failed: {response.status_code}")
