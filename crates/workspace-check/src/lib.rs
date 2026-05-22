pub fn workspace_ready() -> bool {
    true
}

#[cfg(test)]
mod tests {
    use super::workspace_ready;

    #[test]
    fn reports_workspace_ready() {
        assert!(workspace_ready());
    }
}
