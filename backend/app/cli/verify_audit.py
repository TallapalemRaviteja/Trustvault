import sys
from app.database import SessionLocal
from app.services.audit import audit_service


def main():
    print("=" * 60)
    print(" TRUSTVAULT AUDIT TRAIL INTEGRITY VERIFICATION TOOL")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        report = audit_service.verify_chain_integrity(db)
        print(f"Status:               {report['status']}")
        print(f"Events Checked:       {report['total_events_checked']}")
        print(f"First Sequence:       {report['first_sequence']}")
        print(f"Last Sequence:        {report['last_sequence']}")
        print(f"Last Event Hash:      {report['last_event_hash']}")
        print(f"Verification Time:    {report['verified_at']}")
        print("-" * 60)

        if report["is_valid"]:
            print(" [PASS] Audit chain cryptographically verified. No tampering detected.")
            sys.exit(0)
        else:
            print(" [FAIL] TAMPERING DETECTED! Issues found:")
            for issue in report["issues"]:
                print(f"  - {issue}")
            sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
