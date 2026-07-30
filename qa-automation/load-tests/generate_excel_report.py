"""Generates Load_Testing_Report.xlsx using the Enterprise 1200+ Test Case
Workbook generator so that downloading the load-test-reports artifact in GitHub Actions
provides a comprehensive 7-sheet Excel spreadsheet with 1200+ unique QA test cases.
"""

import sys
from pathlib import Path

# Add qa-automation/utilities to sys.path to import enterprise workbook generator
root_dir = Path(__file__).resolve().parent.parent.parent
utilities_dir = root_dir / "qa-automation" / "utilities"
if str(utilities_dir) not in sys.path:
    sys.path.insert(0, str(utilities_dir))

try:
    from generate_enterprise_1200_test_report import build_enterprise_workbook
except ImportError:
    # Fallback if running from a different path structure
    import importlib.util
    gen_path = utilities_dir / "generate_enterprise_1200_test_report.py"
    spec = importlib.util.spec_from_file_location("generate_enterprise_1200_test_report", str(gen_path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    build_enterprise_workbook = mod.build_enterprise_workbook


def build_excel_report(output_path=None):
    script_dir = Path(__file__).resolve().parent
    reports_dir = script_dir / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    output_path = Path(output_path) if output_path else reports_dir / "Load_Testing_Report.xlsx"
    print(f"Building Enterprise 1200+ QA Test Management Workbook at {output_path}...")
    build_enterprise_workbook(str(output_path))


if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else None
    build_excel_report(out_file)
