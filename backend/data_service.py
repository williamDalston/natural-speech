"""
Data Service Module
Handles data fetching, filtering, and export functionality
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from logger_config import logger


class DataService:
    """Service for managing data queries and exports"""
    
    def __init__(self):
        # Mock data - replace with actual database queries
        self.accounts = [
            {"id": "account1", "name": "Account 1"},
            {"id": "account2", "name": "Account 2"},
            {"id": "account3", "name": "Account 3"},
        ]
        
        self.platforms = [
            {"id": "platform1", "name": "Platform 1"},
            {"id": "platform2", "name": "Platform 2"},
            {"id": "platform3", "name": "Platform 3"},
        ]
    
    def get_accounts(self) -> List[Dict]:
        """Get all available accounts"""
        return self.accounts
    
    def get_platforms(self) -> List[Dict]:
        """Get all available platforms"""
        return self.platforms
    
    def fetch_data(
        self,
        start_date: str,
        end_date: str,
        accounts: List[str],
        platforms: List[str],
        range_type: str = "custom"
    ) -> Dict:
        """
        Fetch data for specified date range, accounts, and platforms
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            accounts: List of account IDs to filter by
            platforms: List of platform IDs to filter by
            range_type: Type of range ('today', 'this_month', 'custom')
        
        Returns:
            Dictionary with summary and records
        """
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            
            # Validate date range
            if start > end:
                raise ValueError("Start date must be before end date")
            
            # Calculate date range
            days = (end - start).days + 1
            
            logger.info(
                f"Fetching data: {start_date} to {end_date}, "
                f"{len(accounts)} accounts, {len(platforms)} platforms, "
                f"range_type={range_type}"
            )
            
            # TODO: Replace with actual database query
            # This is a mock implementation
            records = self._generate_mock_records(start, end, accounts, platforms)
            
            # Calculate summary
            summary = {
                "total_records": len(records),
                "total_accounts": len(set(r.get("account") for r in records)),
                "total_platforms": len(set(r.get("platform") for r in records)),
                "date_range": {
                    "start": start_date,
                    "end": end_date,
                    "days": days
                },
                "range_type": range_type
            }
            
            return {
                "summary": summary,
                "records": records
            }
            
        except ValueError as e:
            logger.error(f"Invalid date format: {e}")
            raise
        except Exception as e:
            logger.error(f"Error fetching data: {e}", exc_info=True)
            raise
    
    def _generate_mock_records(
        self,
        start: datetime,
        end: datetime,
        accounts: List[str],
        platforms: List[str]
    ) -> List[Dict]:
        """Generate mock records for demonstration"""
        records = []
        current_date = start
        
        while current_date <= end:
            for account in accounts:
                for platform in platforms:
                    # Generate some mock data
                    records.append({
                        "id": f"record_{len(records) + 1}",
                        "date": current_date.strftime("%Y-%m-%d"),
                        "account": account,
                        "platform": platform,
                        "value": 100 + (len(records) % 1000),
                        "status": "active" if len(records) % 2 == 0 else "inactive",
                        "created_at": current_date.isoformat(),
                    })
            current_date += timedelta(days=1)
        
        return records
    
    def export_to_csv(
        self,
        start_date: str,
        end_date: str,
        accounts: List[str],
        platforms: List[str],
        range_type: str = "custom"
    ) -> str:
        """
        Export data to CSV format
        
        Returns CSV content as string
        """
        data = self.fetch_data(start_date, end_date, accounts, platforms, range_type)
        records = data["records"]
        
        if not records:
            return "No data to export\n"
        
        # Generate CSV
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)
        
        return output.getvalue()


# Create singleton instance
data_service = DataService()

